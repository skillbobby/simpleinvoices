<?php

namespace App\Http\Controllers;

use App\Http\Requests\InvoiceRequest;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentTerm;
use App\Models\Product;
use App\Models\TaxRate;
use App\Services\InvoiceService;
use App\Support\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $invoices) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'all');

        $invoices = Invoice::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%");
                });
            })
            ->when($status === 'overdue', fn ($q) => $q->overdue())
            ->when(in_array($status, Invoice::STATUSES, true), fn ($q) => $q->where('status', $status))
            ->orderByDesc('issue_date')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'customer_name' => $invoice->customer_name,
                'status' => $invoice->displayStatus(),
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $invoice->due_date?->toDateString(),
                'total' => (float) $invoice->total,
                'balance' => (float) $invoice->balance,
            ]);

        $summary = [
            'draft' => $this->summaryFor(fn ($q) => $q->where('status', Invoice::STATUS_DRAFT)),
            'outstanding' => $this->summaryFor(fn ($q) => $q->outstanding(), 'balance'),
            'overdue' => $this->summaryFor(fn ($q) => $q->overdue(), 'balance'),
            'paid' => $this->summaryFor(fn ($q) => $q->where('status', Invoice::STATUS_PAID)),
        ];

        return Inertia::render('invoices/index', [
            'invoices' => $invoices,
            'filters' => ['search' => $search, 'status' => $status],
            'summary' => $summary,
            'currency' => TenantContext::get()?->currency_code ?? 'USD',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('invoices/create', $this->formOptions());
    }

    public function store(InvoiceRequest $request): RedirectResponse
    {
        $invoice = $this->invoices->create(
            TenantContext::get(),
            $request->validated(),
            $request->user(),
        );

        return redirect()
            ->route('invoices.show', $invoice)
            ->with('success', "Invoice {$invoice->number} created.");
    }

    public function show(Invoice $invoice): Response
    {
        $invoice->load(['items', 'payments', 'customer', 'paymentTerm']);

        return Inertia::render('invoices/show', [
            'invoice' => $this->invoicePayload($invoice),
            'company' => $this->tenantPayload(),
            'paymentMethods' => Payment::METHODS,
        ]);
    }

    public function edit(Invoice $invoice): Response
    {
        abort_unless($invoice->isEditable(), 403, 'Paid or void invoices cannot be edited.');

        $invoice->load(['items']);

        return Inertia::render('invoices/edit', [
            ...$this->formOptions(),
            'invoice' => $this->invoicePayload($invoice),
        ]);
    }

    public function update(InvoiceRequest $request, Invoice $invoice): RedirectResponse
    {
        abort_unless($invoice->isEditable(), 403, 'Paid or void invoices cannot be edited.');

        $this->invoices->update($invoice, $request->validated());

        return redirect()
            ->route('invoices.show', $invoice)
            ->with('success', 'Invoice updated.');
    }

    public function markSent(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->invoices->markSent($invoice);

        return back()->with('success', 'Invoice marked as sent and a public link was generated.');
    }

    public function void(Request $request, Invoice $invoice): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $this->invoices->void($invoice);

        return back()->with('success', 'Invoice voided.');
    }

    public function duplicate(Invoice $invoice): RedirectResponse
    {
        $copy = $this->invoices->duplicate($invoice);

        return redirect()
            ->route('invoices.edit', $copy)
            ->with('success', "Invoice duplicated as {$copy->number}.");
    }

    public function destroy(Request $request, Invoice $invoice): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $this->invoices->delete($invoice);

        return redirect()->route('invoices.index')->with('success', 'Invoice deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        $tenant = TenantContext::get();

        return [
            'customers' => Customer::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'company_name', 'email', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country'])
                ->map(fn (Customer $customer) => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'company_name' => $customer->company_name,
                    'email' => $customer->email,
                    'address' => $customer->fullAddress(),
                ])->all(),
            'products' => Product::query()
                ->where('is_active', true)
                ->with('taxRate:id,name,rate')
                ->orderBy('name')
                ->get(['id', 'name', 'sku', 'unit_price', 'unit', 'tax_rate_id'])
                ->map(fn (Product $product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'unit_price' => (float) $product->unit_price,
                    'unit' => $product->unit,
                    'tax_rate_id' => $product->tax_rate_id,
                    'tax_rate' => $product->taxRate ? (float) $product->taxRate->rate : 0,
                ])->all(),
            'taxRates' => TaxRate::query()
                ->where('is_active', true)
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(['id', 'name', 'rate', 'is_default'])
                ->map(fn (TaxRate $rate) => [
                    'id' => $rate->id,
                    'name' => $rate->name,
                    'rate' => (float) $rate->rate,
                    'is_default' => $rate->is_default,
                ])->all(),
            'paymentTerms' => PaymentTerm::query()
                ->orderBy('days')
                ->orderBy('name')
                ->get(['id', 'name', 'days', 'is_default'])
                ->map(fn (PaymentTerm $term) => [
                    'id' => $term->id,
                    'name' => $term->name,
                    'days' => $term->days,
                    'is_default' => $term->is_default,
                ])->all(),
            'defaults' => [
                'issue_date' => today()->toDateString(),
                'due_date' => today()->addDays((int) ($tenant?->default_payment_terms_days ?? 14))->toDateString(),
                'currency_code' => $tenant?->currency_code ?? 'USD',
                'notes' => $tenant?->invoice_notes,
                'terms' => null,
                'footer' => $tenant?->invoice_footer,
                'next_number' => $tenant ? $this->invoices->nextNumberPreview($tenant) : 'INV-0001',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function invoicePayload(Invoice $invoice): array
    {
        return [
            ...$invoice->only([
                'id', 'number', 'status', 'issue_date', 'due_date', 'currency_code',
                'customer_id', 'payment_term_id', 'customer_name', 'customer_email',
                'customer_address', 'subtotal', 'discount_type', 'discount_value',
                'discount_amount', 'tax_total', 'total', 'amount_paid', 'balance',
                'notes', 'terms', 'footer', 'public_token',
            ]),
            'issue_date' => $invoice->issue_date?->toDateString(),
            'due_date' => $invoice->due_date?->toDateString(),
            'sent_at' => $invoice->sent_at?->toIso8601String(),
            'paid_at' => $invoice->paid_at?->toIso8601String(),
            'display_status' => $invoice->displayStatus(),
            'is_overdue' => $invoice->isOverdue(),
            'is_editable' => $invoice->isEditable(),
            'subtotal' => (float) $invoice->subtotal,
            'discount_value' => (float) $invoice->discount_value,
            'discount_amount' => (float) $invoice->discount_amount,
            'tax_total' => (float) $invoice->tax_total,
            'total' => (float) $invoice->total,
            'amount_paid' => (float) $invoice->amount_paid,
            'balance' => (float) $invoice->balance,
            'share_url' => $invoice->publicUrl(),
            'pdf_url' => $invoice->public_token ? route('invoices.public.pdf', $invoice->public_token) : null,
            'items' => $invoice->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'tax_rate_id' => $item->tax_rate_id,
                'description' => $item->description,
                'quantity' => (float) $item->quantity,
                'unit' => $item->unit,
                'unit_price' => (float) $item->unit_price,
                'tax_rate' => (float) $item->tax_rate,
                'tax_amount' => (float) $item->tax_amount,
                'line_subtotal' => (float) $item->line_subtotal,
                'line_total' => (float) $item->line_total,
            ])->all(),
            'payments' => $invoice->payments->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'paid_on' => $payment->paid_on?->toDateString(),
                'amount' => (float) $payment->amount,
                'method' => $payment->method,
                'method_label' => $payment->methodLabel(),
                'reference' => $payment->reference,
                'notes' => $payment->notes,
            ])->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function tenantPayload(): array
    {
        $tenant = TenantContext::get();

        return [
            'name' => $tenant?->name,
            'email' => $tenant?->email,
            'phone' => $tenant?->phone,
            'website' => $tenant?->website,
            'address' => collect([$tenant?->address_line1, $tenant?->address_line2, $tenant?->city, $tenant?->state, $tenant?->postal_code, $tenant?->country])->filter()->implode(', '),
            'tax_id' => $tenant?->tax_id,
            'bank_details' => $tenant?->bank_details,
        ];
    }

    /**
     * @return array{count: int, total: float}
     */
    private function summaryFor(callable $filter, string $column = 'total'): array
    {
        $query = $filter(Invoice::query());

        return [
            'count' => (clone $query)->count(),
            'total' => (float) (clone $query)->sum($column),
        ];
    }
}
