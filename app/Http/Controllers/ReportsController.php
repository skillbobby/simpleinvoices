<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;
use App\Support\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    public function index(Request $request): Response
    {
        [$from, $to] = $this->range($request);

        $invoices = Invoice::query()
            ->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])
            ->whereDate('issue_date', '>=', $from->toDateString())
            ->whereDate('issue_date', '<=', $to->toDateString());

        $summary = [
            'billed' => (float) (clone $invoices)->sum('total'),
            'tax' => (float) (clone $invoices)->sum('tax_total'),
            'collected' => (float) Payment::query()
                ->whereDate('paid_on', '>=', $from->toDateString())
                ->whereDate('paid_on', '<=', $to->toDateString())
                ->sum('amount'),
            'outstanding' => (float) Invoice::query()->outstanding()->sum('balance'),
            'invoice_count' => (clone $invoices)->count(),
            'average_invoice' => (float) (clone $invoices)->avg('total'),
        ];

        return Inertia::render('reports/index', [
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'summary' => $summary,
            'monthly' => $this->monthlySeries($from, $to),
            'aging' => $this->agingBuckets(),
            'topCustomers' => $this->topCustomers($from, $to),
            'taxSummary' => $this->taxSummary($from, $to),
            'statusBreakdown' => $this->statusBreakdown(),
            'currency' => TenantContext::get()?->currency_code ?? 'USD',
            'exportUrl' => route('reports.export', ['from' => $from->toDateString(), 'to' => $to->toDateString()]),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        [$from, $to] = $this->range($request);

        $invoices = Invoice::query()
            ->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])
            ->whereDate('issue_date', '>=', $from->toDateString())
            ->whereDate('issue_date', '<=', $to->toDateString())
            ->orderBy('issue_date')
            ->get();

        $filename = 'invoices-'.$from->toDateString().'-to-'.$to->toDateString().'.csv';

        return response()->streamDownload(function () use ($invoices) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Number', 'Customer', 'Status', 'Issue date', 'Due date', 'Currency', 'Subtotal', 'Discount', 'Tax', 'Total', 'Paid', 'Balance']);

            foreach ($invoices as $invoice) {
                fputcsv($out, [
                    $invoice->number,
                    $invoice->customer_name,
                    $invoice->displayStatus(),
                    $invoice->issue_date?->toDateString(),
                    $invoice->due_date?->toDateString(),
                    $invoice->currency_code,
                    number_format((float) $invoice->subtotal, 2, '.', ''),
                    number_format((float) $invoice->discount_amount, 2, '.', ''),
                    number_format((float) $invoice->tax_total, 2, '.', ''),
                    number_format((float) $invoice->total, 2, '.', ''),
                    number_format((float) $invoice->amount_paid, 2, '.', ''),
                    number_format((float) $invoice->balance, 2, '.', ''),
                ]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function range(Request $request): array
    {
        $from = $request->filled('from')
            ? Carbon::parse((string) $request->query('from'))->startOfDay()
            : now()->startOfYear();
        $to = $request->filled('to')
            ? Carbon::parse((string) $request->query('to'))->endOfDay()
            : now()->endOfDay();

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return [$from, $to];
    }

    /**
     * @return array<int, array{month: string, billed: float, collected: float}>
     */
    private function monthlySeries(Carbon $from, Carbon $to): array
    {
        $start = $from->copy()->startOfMonth();
        $end = $to->copy()->startOfMonth();

        $invoices = Invoice::query()
            ->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])
            ->whereDate('issue_date', '>=', $from->toDateString())
            ->whereDate('issue_date', '<=', $to->toDateString())
            ->get(['issue_date', 'total']);

        $payments = Payment::query()
            ->whereDate('paid_on', '>=', $from->toDateString())
            ->whereDate('paid_on', '<=', $to->toDateString())
            ->get(['paid_on', 'amount']);

        $series = [];
        $cursor = $start->copy();

        while ($cursor->lessThanOrEqualTo($end)) {
            $series[] = [
                'key' => $cursor->format('Y-m'),
                'month' => $cursor->format('M Y'),
                'billed' => 0.0,
                'collected' => 0.0,
            ];
            $cursor->addMonth();
        }

        $indexed = collect($series)->keyBy('key');

        foreach ($invoices as $invoice) {
            $key = Carbon::parse($invoice->issue_date)->format('Y-m');
            if ($indexed->has($key)) {
                $row = $indexed->get($key);
                $row['billed'] += (float) $invoice->total;
                $indexed->put($key, $row);
            }
        }

        foreach ($payments as $payment) {
            $key = Carbon::parse($payment->paid_on)->format('Y-m');
            if ($indexed->has($key)) {
                $row = $indexed->get($key);
                $row['collected'] += (float) $payment->amount;
                $indexed->put($key, $row);
            }
        }

        return $indexed->values()->all();
    }

    /**
     * @return array<int, array{bucket: string, amount: float, count: int}>
     */
    private function agingBuckets(): array
    {
        $buckets = [
            'Current' => 0.0,
            '1-30 days' => 0.0,
            '31-60 days' => 0.0,
            '61-90 days' => 0.0,
            '90+ days' => 0.0,
        ];
        $counts = array_fill_keys(array_keys($buckets), 0);

        Invoice::query()->outstanding()->get()->each(function (Invoice $invoice) use (&$buckets, &$counts) {
            $days = $invoice->due_date && $invoice->due_date->isPast()
                ? (int) $invoice->due_date->startOfDay()->diffInDays(today())
                : 0;

            $bucket = match (true) {
                $days <= 0 => 'Current',
                $days <= 30 => '1-30 days',
                $days <= 60 => '31-60 days',
                $days <= 90 => '61-90 days',
                default => '90+ days',
            };

            $buckets[$bucket] += (float) $invoice->balance;
            $counts[$bucket]++;
        });

        return collect($buckets)
            ->map(fn (float $amount, string $bucket) => [
                'bucket' => $bucket,
                'amount' => round($amount, 2),
                'count' => $counts[$bucket],
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function topCustomers(Carbon $from, Carbon $to): array
    {
        return Customer::query()
            ->withSum(['invoices as billed_total' => fn ($q) => $q->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])->whereDate('issue_date', '>=', $from->toDateString())->whereDate('issue_date', '<=', $to->toDateString())], 'total')
            ->withCount(['invoices as invoice_count' => fn ($q) => $q->whereNotIn('status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])->whereDate('issue_date', '>=', $from->toDateString())->whereDate('issue_date', '<=', $to->toDateString())])
            ->orderByDesc('billed_total')
            ->limit(10)
            ->get()
            ->filter(fn (Customer $customer) => (float) $customer->billed_total > 0)
            ->map(fn (Customer $customer) => [
                'id' => $customer->id,
                'name' => $customer->displayName(),
                'invoice_count' => $customer->invoice_count,
                'billed_total' => (float) $customer->billed_total,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function taxSummary(Carbon $from, Carbon $to): array
    {
        $tenantId = TenantContext::id();

        return DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->where('invoice_items.tenant_id', $tenantId)
            ->whereNotIn('invoices.status', [Invoice::STATUS_DRAFT, Invoice::STATUS_VOID])
            ->whereDate('invoices.issue_date', '>=', $from->toDateString())
            ->whereDate('invoices.issue_date', '<=', $to->toDateString())
            ->groupBy('invoice_items.tax_rate')
            ->selectRaw('invoice_items.tax_rate as rate, SUM(invoice_items.line_subtotal) as taxable, SUM(invoice_items.tax_amount) as tax')
            ->orderBy('invoice_items.tax_rate')
            ->get()
            ->map(fn ($row) => [
                'rate' => (float) $row->rate,
                'taxable' => (float) $row->taxable,
                'tax' => (float) $row->tax,
            ])
            ->all();
    }

    /**
     * @return array<int, array{status: string, count: int, total: float}>
     */
    private function statusBreakdown(): array
    {
        return collect([...Invoice::STATUSES, 'overdue'])
            ->map(function (string $status) {
                $query = $status === 'overdue'
                    ? Invoice::query()->overdue()
                    : Invoice::query()->where('status', $status);

                return [
                    'status' => $status,
                    'count' => (clone $query)->count(),
                    'total' => (float) (clone $query)->sum('total'),
                ];
            })
            ->all();
    }
}
