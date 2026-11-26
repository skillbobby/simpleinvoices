<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'all');

        $customers = Customer::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->withCount(['invoices' => fn ($q) => $q->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])])
            ->withSum(['invoices as outstanding_balance' => fn ($q) => $q->outstanding()], 'balance')
            ->withSum(['invoices as billed_total' => fn ($q) => $q->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])], 'total')
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Customer $customer) => [
                'id' => $customer->id,
                'name' => $customer->name,
                'company_name' => $customer->company_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'city' => $customer->city,
                'country' => $customer->country,
                'is_active' => $customer->is_active,
                'invoices_count' => $customer->invoices_count,
                'billed_total' => (float) $customer->billed_total,
                'outstanding_balance' => (float) $customer->outstanding_balance,
            ]);

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('customers/create');
    }

    public function store(CustomerRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());

        return redirect()
            ->route('customers.show', $customer)
            ->with('success', 'Customer created.');
    }

    public function show(Customer $customer): Response
    {
        $invoices = $customer->invoices()
            ->latest('issue_date')
            ->latest('id')
            ->limit(25)
            ->get()
            ->map(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'status' => $invoice->displayStatus(),
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $invoice->due_date?->toDateString(),
                'total' => (float) $invoice->total,
                'balance' => (float) $invoice->balance,
            ]);

        $payments = Payment::query()
            ->where('customer_id', $customer->id)
            ->latest('paid_on')
            ->limit(15)
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'invoice_id' => $payment->invoice_id,
                'paid_on' => $payment->paid_on?->toDateString(),
                'amount' => (float) $payment->amount,
                'method' => $payment->methodLabel(),
                'reference' => $payment->reference,
            ]);

        return Inertia::render('customers/show', [
            'customer' => [
                ...$customer->only([
                    'id', 'name', 'company_name', 'email', 'phone', 'mobile',
                    'address_line1', 'address_line2', 'city', 'state', 'postal_code',
                    'country', 'tax_id', 'notes', 'is_active',
                ]),
                'created_at' => $customer->created_at?->toDateString(),
                'full_address' => $customer->fullAddress(),
            ],
            'invoices' => $invoices,
            'payments' => $payments,
            'stats' => [
                'billed_total' => (float) Invoice::query()->where('customer_id', $customer->id)->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])->sum('total'),
                'outstanding' => (float) Invoice::query()->where('customer_id', $customer->id)->outstanding()->sum('balance'),
                'paid_total' => (float) Payment::query()->where('customer_id', $customer->id)->sum('amount'),
                'invoices_count' => Invoice::query()->where('customer_id', $customer->id)->count(),
            ],
        ]);
    }

    public function edit(Customer $customer): Response
    {
        return Inertia::render('customers/edit', [
            'customer' => $customer->only([
                'id', 'name', 'company_name', 'email', 'phone', 'mobile',
                'address_line1', 'address_line2', 'city', 'state', 'postal_code',
                'country', 'tax_id', 'currency_code', 'notes', 'is_active',
            ]),
        ]);
    }

    public function update(CustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        return redirect()
            ->route('customers.show', $customer)
            ->with('success', 'Customer updated.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        if ($customer->invoices()->exists()) {
            $customer->update(['is_active' => false]);

            return redirect()
                ->route('customers.index')
                ->with('error', 'Customer has invoices and was archived instead of deleted.');
        }

        $customer->delete();

        return redirect()->route('customers.index')->with('success', 'Customer deleted.');
    }
}
