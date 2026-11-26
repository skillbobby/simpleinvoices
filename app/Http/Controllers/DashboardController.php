<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Support\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $tenant = TenantContext::get();
        $yearStart = now()->startOfYear();

        $billedThisYear = Invoice::query()
            ->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])
            ->whereDate('issue_date', '>=', $yearStart->toDateString());

        $revenueThisYear = (float) (clone $billedThisYear)->sum('total');
        $outstanding = (float) Invoice::query()->outstanding()->sum('balance');
        $overdue = (float) Invoice::query()->overdue()->sum('balance');
        $paidThisMonth = (float) Payment::query()
            ->whereDate('paid_on', '>=', now()->startOfMonth()->toDateString())
            ->whereDate('paid_on', '<=', now()->endOfMonth()->toDateString())
            ->sum('amount');

        $revenueByMonth = $this->revenueByMonth();

        $recentInvoices = Invoice::query()
            ->latest('issue_date')
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(fn (Invoice $invoice) => $this->invoiceSummary($invoice));

        $overdueInvoices = Invoice::query()
            ->overdue()
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(fn (Invoice $invoice) => $this->invoiceSummary($invoice));

        $topCustomers = Customer::query()
            ->withSum(['invoices as billed_total' => fn ($q) => $q->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])], 'total')
            ->withCount(['invoices' => fn ($q) => $q->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])])
            ->orderByDesc('billed_total')
            ->limit(5)
            ->get()
            ->map(fn (Customer $customer) => [
                'id' => $customer->id,
                'name' => $customer->displayName(),
                'email' => $customer->email,
                'invoices_count' => $customer->invoices_count,
                'billed_total' => (float) $customer->billed_total,
            ]);

        return Inertia::render('dashboard', [
            'metrics' => [
                'revenue_this_year' => $revenueThisYear,
                'outstanding' => $outstanding,
                'overdue' => $overdue,
                'paid_this_month' => $paidThisMonth,
                'invoice_count' => Invoice::query()->count(),
                'customer_count' => Customer::query()->count(),
            ],
            'revenueByMonth' => $revenueByMonth,
            'recentInvoices' => $recentInvoices,
            'overdueInvoices' => $overdueInvoices,
            'topCustomers' => $topCustomers,
            'currency' => $tenant?->currency_code ?? 'USD',
        ]);
    }

    /**
     * @return array<int, array{month: string, total: float, paid: float}>
     */
    private function revenueByMonth(): array
    {
        $start = now()->subMonths(11)->startOfMonth();

        $invoices = Invoice::query()
            ->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])
            ->whereDate('issue_date', '>=', $start->toDateString())
            ->get(['issue_date', 'total']);

        $payments = Payment::query()
            ->whereDate('paid_on', '>=', $start->toDateString())
            ->get(['paid_on', 'amount']);

        $months = collect(range(0, 11))->map(function (int $offset) use ($start) {
            $date = $start->copy()->addMonths($offset);

            return [
                'key' => $date->format('Y-m'),
                'month' => $date->format('M'),
                'total' => 0.0,
                'paid' => 0.0,
            ];
        })->keyBy('key');

        foreach ($invoices as $invoice) {
            $key = Carbon::parse($invoice->issue_date)->format('Y-m');
            if ($months->has($key)) {
                $row = $months->get($key);
                $row['total'] += (float) $invoice->total;
                $months->put($key, $row);
            }
        }

        foreach ($payments as $payment) {
            $key = Carbon::parse($payment->paid_on)->format('Y-m');
            if ($months->has($key)) {
                $row = $months->get($key);
                $row['paid'] += (float) $payment->amount;
                $months->put($key, $row);
            }
        }

        return $months->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function invoiceSummary(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'number' => $invoice->number,
            'customer_name' => $invoice->customer_name,
            'status' => $invoice->displayStatus(),
            'issue_date' => $invoice->issue_date?->toDateString(),
            'due_date' => $invoice->due_date?->toDateString(),
            'total' => (float) $invoice->total,
            'balance' => (float) $invoice->balance,
        ];
    }
}
