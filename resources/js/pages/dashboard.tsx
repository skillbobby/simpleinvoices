import EmptyState from '@/components/empty-state';
import InvoiceStatusBadge from '@/components/invoice-status-badge';
import PageHeader from '@/components/page-header';
import StatCard from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney } from '@/lib/format';
import { type BreadcrumbItem, type InvoiceRow, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Plus } from 'lucide-react';

interface DashboardProps {
    metrics: {
        revenue_this_year: number;
        outstanding: number;
        overdue: number;
        paid_this_month: number;
        invoice_count: number;
        customer_count: number;
    };
    revenueByMonth: Array<{ month: string; total: number; paid: number }>;
    recentInvoices: InvoiceRow[];
    overdueInvoices: InvoiceRow[];
    topCustomers: Array<{ id: number; name: string; email: string | null; invoices_count: number; billed_total: number }>;
    currency: string;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

export default function Dashboard({ metrics, revenueByMonth, recentInvoices, overdueInvoices, topCustomers, currency }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const firstName = (auth?.user?.name ?? '').split(' ')[0];
    const maxRevenue = Math.max(...revenueByMonth.map((row) => Math.max(row.total, row.paid)), 1);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-8">
                <PageHeader
                    eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    title={firstName ? `Welcome back, ${firstName}.` : 'Your billing desk'}
                    description="Track what you have billed, what has been collected and what needs a nudge."
                    actions={
                        <>
                            <Button variant="outline" asChild className="border-hairline bg-surface text-ink hover:bg-surface-2">
                                <Link href={route('customers.create')}>Add customer</Link>
                            </Button>
                            <Button asChild className="bg-ink hover:bg-ink/90 text-white">
                                <Link href={route('invoices.create')}>
                                    <Plus className="h-4 w-4" /> New invoice
                                </Link>
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Billed this year"
                        value={formatMoney(metrics.revenue_this_year, currency)}
                        hint={`${metrics.invoice_count} invoices all time`}
                    />
                    <StatCard label="Outstanding" value={formatMoney(metrics.outstanding, currency)} hint="Awaiting payment" accent />
                    <StatCard
                        label="Overdue"
                        value={formatMoney(metrics.overdue, currency)}
                        hint={metrics.overdue > 0 ? 'Follow up required' : 'Nothing past due'}
                    />
                    <StatCard
                        label="Collected this month"
                        value={formatMoney(metrics.paid_this_month, currency)}
                        hint={`${metrics.customer_count} customers`}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                    <section className="border-hairline bg-surface rounded-xl border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-ink text-lg font-medium">Revenue rhythm</h2>
                                <p className="text-ink-muted text-sm">Billed versus collected, last 12 months.</p>
                            </div>
                            <div className="text-ink-muted flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1.5">
                                    <span className="bg-ink h-2 w-2 rounded-full" /> Billed
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="bg-fin h-2 w-2 rounded-full" /> Collected
                                </span>
                            </div>
                        </div>
                        <div className="mt-8 flex h-48 items-end gap-2 sm:gap-3">
                            {revenueByMonth.map((row) => (
                                <div key={row.month} className="group flex flex-1 flex-col items-center gap-2">
                                    <div className="flex h-40 w-full items-end justify-center gap-1">
                                        <div
                                            className="bg-ink/85 group-hover:bg-ink w-1/2 rounded-t-sm transition-all"
                                            style={{ height: `${Math.max(4, (row.total / maxRevenue) * 100)}%` }}
                                            title={`Billed ${formatMoney(row.total, currency)}`}
                                        />
                                        <div
                                            className="bg-fin/80 group-hover:bg-fin w-1/3 rounded-t-sm transition-all"
                                            style={{ height: `${Math.max(4, (row.paid / maxRevenue) * 100)}%` }}
                                            title={`Collected ${formatMoney(row.paid, currency)}`}
                                        />
                                    </div>
                                    <span className="text-ink-subtle text-[10px]">{row.month}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="border-hairline bg-surface rounded-xl border p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-ink text-lg font-medium">Needs attention</h2>
                            <Link
                                href={route('invoices.index', { status: 'overdue' })}
                                className="text-ink-muted text-xs underline-offset-4 hover:underline"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="mt-4 space-y-3">
                            {overdueInvoices.length === 0 ? (
                                <p className="border-hairline text-ink-muted rounded-lg border border-dashed px-4 py-8 text-center text-sm">
                                    No overdue invoices. Nice work.
                                </p>
                            ) : (
                                overdueInvoices.map((invoice) => (
                                    <Link
                                        key={invoice.id}
                                        href={route('invoices.show', invoice.id)}
                                        className="border-hairline-soft hover:bg-canvas flex items-center justify-between rounded-lg border px-3 py-3"
                                    >
                                        <div>
                                            <p className="text-ink text-sm font-medium">{invoice.customer_name}</p>
                                            <p className="text-ink-subtle text-xs">
                                                {invoice.number} · due {formatDate(invoice.due_date)}
                                            </p>
                                        </div>
                                        <span className="text-danger text-sm font-medium">{formatMoney(invoice.balance, currency)}</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <section className="border-hairline bg-surface overflow-hidden rounded-xl border">
                    <div className="border-hairline flex items-center justify-between border-b px-6 py-5">
                        <h2 className="text-ink text-lg font-medium">Recent invoices</h2>
                        <Link href={route('invoices.index')} className="text-ink-muted hover:text-ink inline-flex items-center gap-1 text-xs">
                            All invoices <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    {recentInvoices.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                title="No invoices yet"
                                description="Create your first invoice and it will show up here with live payment status."
                                action={
                                    <Button asChild className="bg-ink text-white">
                                        <Link href={route('invoices.create')}>Create invoice</Link>
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-hairline text-ink-subtle border-b text-left text-[11px] tracking-wide uppercase">
                                        <th className="px-6 py-3 font-medium">Invoice</th>
                                        <th className="px-3 py-3 font-medium">Customer</th>
                                        <th className="px-3 py-3 font-medium">Status</th>
                                        <th className="px-3 py-3 font-medium">Issued</th>
                                        <th className="px-3 py-3 text-right font-medium">Total</th>
                                        <th className="px-6 py-3 text-right font-medium">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="border-hairline-soft hover:bg-canvas/60 border-b last:border-0">
                                            <td className="px-6 py-3.5">
                                                <Link href={route('invoices.show', invoice.id)} className="text-ink font-medium hover:underline">
                                                    {invoice.number}
                                                </Link>
                                            </td>
                                            <td className="text-ink-muted px-3 py-3.5">{invoice.customer_name}</td>
                                            <td className="px-3 py-3.5">
                                                <InvoiceStatusBadge status={invoice.status} />
                                            </td>
                                            <td className="text-ink-muted px-3 py-3.5">{formatDate(invoice.issue_date)}</td>
                                            <td className="text-ink px-3 py-3.5 text-right">{formatMoney(invoice.total, currency)}</td>
                                            <td className="text-ink px-6 py-3.5 text-right">{formatMoney(invoice.balance, currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="border-hairline bg-surface rounded-xl border p-6">
                        <h2 className="text-ink text-lg font-medium">Top customers</h2>
                        <p className="text-ink-muted text-sm">By lifetime billed value.</p>
                        <div className="mt-5 space-y-3">
                            {topCustomers.length === 0 ? (
                                <p className="text-ink-muted text-sm">No billed customers yet.</p>
                            ) : (
                                topCustomers.map((customer, index) => (
                                    <Link
                                        key={customer.id}
                                        href={route('customers.show', customer.id)}
                                        className="border-hairline-soft flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="bg-canvas text-ink-muted flex h-7 w-7 items-center justify-center rounded-full text-xs">
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="text-ink text-sm font-medium">{customer.name}</p>
                                                <p className="text-ink-subtle text-xs">{customer.invoices_count} invoices</p>
                                            </div>
                                        </div>
                                        <span className="text-ink text-sm">{formatMoney(customer.billed_total, currency)}</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-ink rounded-xl border border-transparent p-6 text-white">
                        <p className="text-[11px] tracking-[0.08em] text-white/50 uppercase">Your workspace</p>
                        <h2 className="mt-2 text-2xl font-medium tracking-tight">
                            {metrics.customer_count} customers, {metrics.invoice_count} invoices
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-white/70">
                            Every company on Simple Invoices is isolated: your customers, invoices and payments never mix with another tenant.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            <Button asChild className="text-ink bg-white hover:bg-white/90">
                                <Link href={route('reports.index')}>Open reports</Link>
                            </Button>
                            <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                                <Link href={route('payments.index')}>Payment ledger</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
