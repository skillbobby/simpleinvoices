<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\TaxRate;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    public function __construct(
        private readonly InvoiceCalculator $calculator,
        private readonly InvoiceNumberService $numbers,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Tenant $tenant, array $data, ?User $user = null): Invoice
    {
        return DB::transaction(function () use ($tenant, $data) {
            $customer = $this->resolveCustomer($tenant, $data);

            $items = $this->prepareItems($tenant, $data['items'] ?? []);
            $totals = $this->calculator->calculate(
                $items,
                $data['discount_type'] ?? 'none',
                $data['discount_value'] ?? 0,
            );

            $issueDate = isset($data['issue_date']) ? Carbon::parse($data['issue_date']) : today();
            $dueDate = $this->resolveDueDate($issueDate, $data, $tenant);

            $status = ($data['status'] ?? Invoice::STATUS_DRAFT) === Invoice::STATUS_SENT
                ? Invoice::STATUS_SENT
                : Invoice::STATUS_DRAFT;

            $invoice = Invoice::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer?->id,
                'payment_term_id' => $data['payment_term_id'] ?? null,
                'number' => $this->numbers->next($tenant),
                'status' => $status,
                'issue_date' => $issueDate->toDateString(),
                'due_date' => $dueDate->toDateString(),
                'currency_code' => $data['currency_code'] ?? $tenant->currency_code,
                'customer_name' => $customer?->displayName() ?? (string) ($data['customer_name'] ?? 'Customer'),
                'customer_email' => $customer?->email ?? ($data['customer_email'] ?? null),
                'customer_address' => $customer?->fullAddress(),
                'subtotal' => $totals['subtotal'],
                'discount_type' => $data['discount_type'] ?? 'none',
                'discount_value' => $data['discount_value'] ?? 0,
                'discount_amount' => $totals['discount_amount'],
                'tax_total' => $totals['tax_total'],
                'total' => $totals['total'],
                'amount_paid' => 0,
                'balance' => $totals['total'],
                'notes' => $data['notes'] ?? $tenant->invoice_notes,
                'terms' => $data['terms'] ?? null,
                'footer' => $data['footer'] ?? $tenant->invoice_footer,
                'public_token' => $status === Invoice::STATUS_SENT ? Invoice::generatePublicToken() : null,
                'sent_at' => $status === Invoice::STATUS_SENT ? now() : null,
            ]);

            $this->replaceItems($invoice, $totals['items']);

            return $invoice->fresh(['items', 'customer', 'payments']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Invoice $invoice, array $data): Invoice
    {
        return DB::transaction(function () use ($invoice, $data) {
            $tenant = Tenant::findOrFail($invoice->tenant_id);
            $customer = array_key_exists('customer_id', $data)
                ? $this->resolveCustomer($tenant, $data)
                : $invoice->customer;

            $items = $this->prepareItems($tenant, $data['items'] ?? $invoice->items->toArray());
            $totals = $this->calculator->calculate(
                $items,
                $data['discount_type'] ?? $invoice->discount_type,
                $data['discount_value'] ?? $invoice->discount_value,
            );

            $issueDate = isset($data['issue_date']) ? Carbon::parse($data['issue_date']) : $invoice->issue_date;
            $dueDate = $this->resolveDueDate($issueDate, $data, $tenant, $invoice);

            $invoice->fill([
                'customer_id' => $customer?->id,
                'payment_term_id' => $data['payment_term_id'] ?? $invoice->payment_term_id,
                'issue_date' => $issueDate->toDateString(),
                'due_date' => $dueDate->toDateString(),
                'currency_code' => $data['currency_code'] ?? $invoice->currency_code,
                'customer_name' => $customer?->displayName() ?? (string) ($data['customer_name'] ?? $invoice->customer_name),
                'customer_email' => $customer?->email ?? ($data['customer_email'] ?? $invoice->customer_email),
                'customer_address' => $customer?->fullAddress() ?? $invoice->customer_address,
                'subtotal' => $totals['subtotal'],
                'discount_type' => $data['discount_type'] ?? $invoice->discount_type,
                'discount_value' => $data['discount_value'] ?? $invoice->discount_value,
                'discount_amount' => $totals['discount_amount'],
                'tax_total' => $totals['tax_total'],
                'total' => $totals['total'],
                'notes' => $data['notes'] ?? $invoice->notes,
                'terms' => $data['terms'] ?? $invoice->terms,
                'footer' => $data['footer'] ?? $invoice->footer,
            ]);

            $invoice->save();

            $this->replaceItems($invoice, $totals['items']);
            $this->syncPaymentState($invoice->fresh());

            return $invoice->fresh(['items', 'customer', 'payments']);
        });
    }

    public function markSent(Invoice $invoice): Invoice
    {
        if ($invoice->isVoid()) {
            return $invoice;
        }

        $invoice->forceFill([
            'status' => (float) $invoice->amount_paid > 0 ? Invoice::STATUS_PARTIAL : Invoice::STATUS_SENT,
            'sent_at' => $invoice->sent_at ?? now(),
            'public_token' => $invoice->public_token ?: Invoice::generatePublicToken(),
        ])->save();

        return $invoice->fresh();
    }

    public function void(Invoice $invoice): Invoice
    {
        $invoice->forceFill([
            'status' => Invoice::STATUS_VOID,
            'voided_at' => now(),
            'balance' => 0,
        ])->save();

        return $invoice->fresh();
    }

    public function duplicate(Invoice $invoice): Invoice
    {
        $tenant = Tenant::findOrFail($invoice->tenant_id);
        $invoice->load('items');

        return $this->create($tenant, [
            'customer_id' => $invoice->customer_id,
            'issue_date' => today()->toDateString(),
            'due_date' => today()->addDays((int) $tenant->default_payment_terms_days)->toDateString(),
            'currency_code' => $invoice->currency_code,
            'discount_type' => $invoice->discount_type,
            'discount_value' => $invoice->discount_value,
            'notes' => $invoice->notes,
            'terms' => $invoice->terms,
            'footer' => $invoice->footer,
            'status' => Invoice::STATUS_DRAFT,
            'items' => $invoice->items->map(fn ($item) => [
                'product_id' => $item->product_id,
                'tax_rate_id' => $item->tax_rate_id,
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'unit_price' => $item->unit_price,
            ])->all(),
        ]);
    }

    public function delete(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice->items()->delete();
            $invoice->delete();
        });
    }

    /**
     * Recompute paid/balance/status from the payment ledger.
     */
    public function syncPaymentState(Invoice $invoice): Invoice
    {
        $paid = (float) $invoice->payments()->sum('amount');
        $total = (float) $invoice->total;
        $balance = round($total - $paid, 2);

        $attributes = [
            'amount_paid' => round($paid, 2),
            'balance' => max(0, $balance),
        ];

        if ($invoice->status !== Invoice::STATUS_VOID) {
            if ($balance <= 0.004 && $total > 0) {
                $attributes['status'] = Invoice::STATUS_PAID;
                $attributes['paid_at'] = $invoice->paid_at ?? now();
            } elseif ($paid > 0) {
                $attributes['status'] = Invoice::STATUS_PARTIAL;
                $attributes['paid_at'] = null;
            } else {
                $attributes['status'] = $invoice->sent_at
                    ? Invoice::STATUS_SENT
                    : Invoice::STATUS_DRAFT;
                $attributes['paid_at'] = null;
            }
        }

        $invoice->forceFill($attributes)->save();

        return $invoice->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveCustomer(Tenant $tenant, array $data): ?Customer
    {
        if (empty($data['customer_id'])) {
            return null;
        }

        // forTenant() bypasses the active scope so background jobs and seeders
        // can create invoices for an explicitly provided tenant.
        return Customer::forTenant($tenant)->find((int) $data['customer_id']);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function prepareItems(Tenant $tenant, array $items): array
    {
        $taxRates = TaxRate::forTenant($tenant)->pluck('rate', 'id');

        return collect($items)
            ->filter(fn ($item) => trim((string) ($item['description'] ?? '')) !== '')
            ->map(function ($item) use ($taxRates) {
                $taxRateId = $item['tax_rate_id'] ?? null;
                $rate = $item['tax_rate'] ?? 0;

                if ($taxRateId && $taxRates->has((int) $taxRateId)) {
                    $rate = $taxRates[(int) $taxRateId];
                }

                return [
                    'product_id' => $item['product_id'] ?? null,
                    'tax_rate_id' => $taxRateId ?: null,
                    'description' => trim((string) $item['description']),
                    'quantity' => $item['quantity'] ?? 1,
                    'unit' => $item['unit'] ?? 'unit',
                    'unit_price' => $item['unit_price'] ?? 0,
                    'tax_rate' => $rate,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function replaceItems(Invoice $invoice, array $items): void
    {
        $invoice->items()->delete();

        foreach ($items as $item) {
            $invoice->items()->create([
                ...$item,
                'tenant_id' => $invoice->tenant_id,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveDueDate(Carbon $issueDate, array $data, Tenant $tenant, ?Invoice $existing = null): Carbon
    {
        if (! empty($data['due_date'])) {
            return Carbon::parse($data['due_date']);
        }

        if (! empty($data['payment_term_id'])) {
            $term = $tenant->paymentTerms()->find($data['payment_term_id']);
            if ($term) {
                return $issueDate->copy()->addDays($term->days);
            }
        }

        if ($existing && $existing->due_date) {
            return $existing->due_date;
        }

        return $issueDate->copy()->addDays(max(0, (int) $tenant->default_payment_terms_days));
    }

    public function nextNumberPreview(Tenant $tenant): string
    {
        return sprintf(
            '%s-%s',
            $tenant->invoice_prefix ?: 'INV',
            str_pad((string) max(1, (int) $tenant->invoice_next_number), max(1, (int) $tenant->invoice_number_padding), '0', STR_PAD_LEFT)
        );
    }
}
