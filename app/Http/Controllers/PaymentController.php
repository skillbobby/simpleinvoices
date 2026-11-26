<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentRequest;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $method = (string) $request->query('method', 'all');

        $payments = Payment::query()
            ->with(['invoice:id,number', 'customer:id,name,company_name'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('reference', 'like', "%{$search}%")
                        ->orWhereHas('invoice', fn ($invoice) => $invoice->where('number', 'like', "%{$search}%"))
                        ->orWhereHas('customer', function ($customer) use ($search) {
                            $customer->where('name', 'like', "%{$search}%")
                                ->orWhere('company_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($method !== 'all', fn ($q) => $q->where('method', $method))
            ->orderByDesc('paid_on')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Payment $payment) => [
                'id' => $payment->id,
                'invoice_id' => $payment->invoice_id,
                'invoice_number' => $payment->invoice?->number,
                'customer_name' => $payment->customer?->displayName(),
                'paid_on' => $payment->paid_on?->toDateString(),
                'amount' => (float) $payment->amount,
                'method' => $payment->method,
                'method_label' => $payment->methodLabel(),
                'reference' => $payment->reference,
            ]);

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'filters' => ['search' => $search, 'method' => $method],
            'methods' => Payment::METHODS,
            'summary' => [
                'this_month' => (float) Payment::query()->whereDate('paid_on', '>=', now()->startOfMonth()->toDateString())->whereDate('paid_on', '<=', now()->endOfMonth()->toDateString())->sum('amount'),
                'this_year' => (float) Payment::query()->whereDate('paid_on', '>=', now()->startOfYear()->toDateString())->whereDate('paid_on', '<=', now()->endOfYear()->toDateString())->sum('amount'),
                'count' => Payment::query()->count(),
            ],
        ]);
    }

    public function store(PaymentRequest $request, Invoice $invoice): RedirectResponse
    {
        $this->payments->record($invoice, $request->validated(), $request->user());

        return back()->with('success', 'Payment recorded.');
    }

    public function destroy(Request $request, Payment $payment): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $this->payments->delete($payment);

        return back()->with('success', 'Payment deleted.');
    }
}
