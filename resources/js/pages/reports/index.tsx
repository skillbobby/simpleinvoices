import InvoiceStatusBadge from '@/components/invoice-status-badge';
import PageHeader from '@/components/page-header';
import StatCard from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/reports',
    },
];

interface ReportsIndexProps {
    filters: {
        from: string;
        to: string;
    };
    summary: {
        billed: number;
        tax: number;
        collected: number;
        outstanding: number;
        invoice_count: number;
        average_invoice: number;
    };
    monthly: Array<{ key: string; month: string; billed: number; collected: number }>;
    aging: Array<{ bucket: string; amount: number; count: number }>;
    topCustomers: Array<{ id: number; name: string; invoice_count: number; billed_total: number }>;
    taxSummary: Array<{ rate: number; taxable: number; tax: number }>;
    statusBreakdown: Array<{ status: string; count: number; total: number }>;
    currency: string;
    exportUrl: string;
}

function formatRate(rate: number): string {
    return Number(rate.toFixed(2)).toString();
}

const cardClass = 'rounded-xl border border-hairline bg-surface';
const sectionTitleClass = 'text-base font-medium text-ink';
const sectionHintClass = 'mt-1 text-sm text-ink-muted';

export default function ReportsIndex({
    filters,
    summary,
    monthly,
    aging,
    topCustomers,
    taxSummary,
    statusBreakdown,
    currency,
    exportUrl,
}: ReportsIndexProps) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const applyRange = (event: FormEvent) => {
        event.preventDefault();
        router.get(route('reports.index'), { from, to }, { preserveScroll: true });
    };

    const maxMonthly = Math.max(1, ...monthly.map((row) => Math.max(row.billed, row.collected)));
    const maxAging = Math.max(1, ...aging.map((row) => row.amount));

    const barHeight = (value: number) => `${Math.max((value / maxMonthly) * 100, value > 0 ? 2 : 0)}%`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="space-y-6">
                <PageHeader
                    title="Reports"
                    description="A period view of what you billed, what you collected, and where the money is stuck."
                    actions={
                        <Button variant="outline" asChild>
                            <a href={exportUrl}>
                                <Download /> Export CSV
                            </a>
                        </Button>
                    }
                />

                <form onSubmit={applyRange} className={`${cardClass} flex flex-col gap-4 p-4 md:flex-row md:items-end md:justify-between`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="grid gap-1.5">
                            <label htmlFor="from" className="text-ink-subtle text-xs font-medium">
                                From
                            </label>
                            <input
                                id="from"
                                type="date"
                                value={from}
                                max={to}
                                onChange={(event) => setFrom(event.target.value)}
                                className="border-hairline bg-surface text-ink focus:ring-ring h-10 rounded-md border px-3 text-sm focus:ring-2 focus:outline-hidden"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label htmlFor="to" className="text-ink-subtle text-xs font-medium">
                                To
                            </label>
                            <input
                                id="to"
                                type="date"
                                value={to}
                                min={from}
                                onChange={(event) => setTo(event.target.value)}
                                className="border-hairline bg-surface text-ink focus:ring-ring h-10 rounded-md border px-3 text-sm focus:ring-2 focus:outline-hidden"
                            />
                        </div>
                        <Button type="submit">Apply range</Button>
                    </div>
                    <p className="text-ink-subtle text-xs">
                        Showing {summary.invoice_count} invoice{summary.invoice_count === 1 ? '' : 's'} outside draft and void
                    </p>
                </form>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard label="Billed" value={formatMoney(summary.billed, currency)} hint="Invoices issued in range" />
                    <StatCard label="Collected" value={formatMoney(summary.collected, currency)} hint="Payments received in range" accent />
                    <StatCard label="Outstanding" value={formatMoney(summary.outstanding, currency)} hint="Open balance across all invoices" />
                    <StatCard label="Tax collected" value={formatMoney(summary.tax, currency)} hint="Tax on invoices in range" />
                    <StatCard
                        label="Average invoice"
                        value={formatMoney(summary.average_invoice, currency)}
                        hint={`${summary.invoice_count} invoices in range`}
                    />
                </div>

                <div className={`${cardClass} p-5 md:p-6`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className={sectionTitleClass}>Billed vs collected</h2>
                            <p className={sectionHintClass}>Monthly totals across the selected range.</p>
                        </div>
                        <div className="text-ink-muted flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5">
                                <span className="bg-ink h-2 w-2 rounded-sm" /> Billed
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="bg-fin h-2 w-2 rounded-sm" /> Collected
                            </span>
                        </div>
                    </div>

                    {monthly.length === 0 ? (
                        <p className="text-ink-muted py-12 text-center text-sm">No monthly activity in this range.</p>
                    ) : (
                        <div className="mt-8 overflow-x-auto">
                            <div className="border-hairline flex min-w-[560px] gap-3 border-b">
                                {monthly.map((row) => (
                                    <div key={row.key} className="flex min-w-0 flex-1 flex-col items-center">
                                        <div
                                            className="flex h-44 w-full items-end justify-center gap-1.5"
                                            role="img"
                                            aria-label={`${row.month}: billed ${formatMoney(row.billed, currency)}, collected ${formatMoney(row.collected, currency)}`}
                                        >
                                            <div
                                                className="bg-ink w-3 rounded-t-sm"
                                                style={{ height: barHeight(row.billed) }}
                                                title={`Billed ${formatMoney(row.billed, currency)}`}
                                            />
                                            <div
                                                className="bg-fin w-3 rounded-t-sm"
                                                style={{ height: barHeight(row.collected) }}
                                                title={`Collected ${formatMoney(row.collected, currency)}`}
                                            />
                                        </div>
                                        <span className="text-ink-subtle mt-3 w-full truncate text-center text-[11px]">{row.month}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={`${cardClass} overflow-hidden`}>
                    <div className="border-hairline border-b p-5 md:p-6">
                        <h2 className={sectionTitleClass}>Receivables aging</h2>
                        <p className={sectionHintClass}>Outstanding balances by how long they have been due.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left text-sm">
                            <thead>
                                <tr className="border-hairline bg-surface-2/60 text-ink-subtle border-b text-[11px] tracking-wide uppercase">
                                    <th className="px-5 py-3 font-medium">Bucket</th>
                                    <th className="px-5 py-3 text-right font-medium">Invoices</th>
                                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                                    <th className="w-[38%] px-5 py-3 font-medium">Share</th>
                                </tr>
                            </thead>
                            <tbody className="divide-hairline-soft divide-y">
                                {aging.map((row) => (
                                    <tr key={row.bucket}>
                                        <td className="text-ink px-5 py-3.5 font-medium">{row.bucket}</td>
                                        <td className="text-ink-muted px-5 py-3.5 text-right tabular-nums">{row.count}</td>
                                        <td className="text-ink px-5 py-3.5 text-right tabular-nums">{formatMoney(row.amount, currency)}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="bg-surface-2 h-1.5 w-full overflow-hidden rounded-full">
                                                <div
                                                    className="bg-ink h-full rounded-full"
                                                    style={{ width: `${Math.max((row.amount / maxAging) * 100, row.amount > 0 ? 2 : 0)}%` }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className={`${cardClass} overflow-hidden`}>
                        <div className="border-hairline border-b p-5 md:p-6">
                            <h2 className={sectionTitleClass}>Top customers</h2>
                            <p className={sectionHintClass}>Highest billed totals in this range.</p>
                        </div>
                        {topCustomers.length === 0 ? (
                            <p className="text-ink-muted px-5 py-10 text-center text-sm">No customer activity in this range.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[420px] text-left text-sm">
                                    <thead>
                                        <tr className="border-hairline bg-surface-2/60 text-ink-subtle border-b text-[11px] tracking-wide uppercase">
                                            <th className="px-5 py-3 font-medium">Customer</th>
                                            <th className="px-5 py-3 text-right font-medium">Invoices</th>
                                            <th className="px-5 py-3 text-right font-medium">Billed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-hairline-soft divide-y">
                                        {topCustomers.map((customer) => (
                                            <tr key={customer.id}>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-surface-2 text-ink flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium">
                                                            {customer.name.charAt(0).toUpperCase()}
                                                        </span>
                                                        <span className="text-ink truncate font-medium">{customer.name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-ink-muted px-5 py-3.5 text-right tabular-nums">{customer.invoice_count}</td>
                                                <td className="text-ink px-5 py-3.5 text-right tabular-nums">
                                                    {formatMoney(customer.billed_total, currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className={`${cardClass} overflow-hidden`}>
                        <div className="border-hairline border-b p-5 md:p-6">
                            <h2 className={sectionTitleClass}>Tax summary</h2>
                            <p className={sectionHintClass}>Taxable sales and tax collected per rate.</p>
                        </div>
                        {taxSummary.length === 0 ? (
                            <p className="text-ink-muted px-5 py-10 text-center text-sm">No tax recorded in this range.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[420px] text-left text-sm">
                                    <thead>
                                        <tr className="border-hairline bg-surface-2/60 text-ink-subtle border-b text-[11px] tracking-wide uppercase">
                                            <th className="px-5 py-3 font-medium">Rate</th>
                                            <th className="px-5 py-3 text-right font-medium">Taxable</th>
                                            <th className="px-5 py-3 text-right font-medium">Tax</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-hairline-soft divide-y">
                                        {taxSummary.map((row) => (
                                            <tr key={row.rate}>
                                                <td className="px-5 py-3.5">
                                                    <span className="border-hairline text-ink-muted inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
                                                        {formatRate(row.rate)}%
                                                    </span>
                                                </td>
                                                <td className="text-ink-muted px-5 py-3.5 text-right tabular-nums">
                                                    {formatMoney(row.taxable, currency)}
                                                </td>
                                                <td className="text-ink px-5 py-3.5 text-right tabular-nums">{formatMoney(row.tax, currency)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${cardClass} p-5 md:p-6`}>
                    <h2 className={sectionTitleClass}>Invoice status</h2>
                    <p className={sectionHintClass}>Every invoice by current status, with count and total.</p>
                    <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4">
                        {statusBreakdown.map((row) => (
                            <div key={row.status} className="flex items-center gap-2.5">
                                <InvoiceStatusBadge status={row.status} />
                                <span className="text-ink-muted text-xs tabular-nums">
                                    {row.count} · {formatMoney(row.total, currency)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
