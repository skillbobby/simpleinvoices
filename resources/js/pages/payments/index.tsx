import EmptyState from '@/components/empty-state';
import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import SearchField from '@/components/search-field';
import StatCard from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney } from '@/lib/format';
import { type BreadcrumbItem, type Paginated, type Payment, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Banknote, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payments',
        href: '/payments',
    },
];

interface PaymentsIndexProps {
    payments: Paginated<Payment>;
    filters: {
        search: string;
        method: string;
    };
    methods: Record<string, string>;
    summary: {
        this_month: number;
        this_year: number;
        count: number;
    };
}

export default function PaymentsIndex({ payments, filters, methods, summary }: PaymentsIndexProps) {
    const { auth, tenant } = usePage<SharedData>().props;
    const canDelete = auth.user?.can_manage_settings ?? false;
    const currency = tenant?.currency_code ?? 'USD';

    const applyFilters = (next: { search?: string; method?: string }) => {
        router.get(
            route('payments.index'),
            {
                search: next.search ?? filters.search,
                method: next.method ?? filters.method,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const destroy = (payment: Payment) => {
        const label = payment.invoice_number ? `payment for ${payment.invoice_number}` : 'this payment';

        if (window.confirm(`Delete ${label}? The invoice balance will be recalculated.`)) {
            router.delete(route('payments.destroy', payment.id), { preserveScroll: true });
        }
    };

    const hasFilters = filters.search !== '' || (filters.method !== '' && filters.method !== 'all');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments" />

            <div className="space-y-6">
                <PageHeader title="Payments" description="Every amount received against your invoices, in one ledger." />

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="This month" value={formatMoney(summary.this_month, currency)} hint="Received this calendar month" />
                    <StatCard label="This year" value={formatMoney(summary.this_year, currency)} hint="Received year to date" accent />
                    <StatCard label="Payments recorded" value={summary.count} hint="All time" />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SearchField value={filters.search} placeholder="Search payments…" onSearch={(value) => applyFilters({ search: value })} />
                    <div className="flex items-center gap-2">
                        <label htmlFor="method-filter" className="text-ink-subtle text-xs font-medium">
                            Method
                        </label>
                        <select
                            id="method-filter"
                            value={filters.method === '' ? 'all' : filters.method}
                            onChange={(event) => applyFilters({ method: event.target.value })}
                            className="border-hairline bg-surface text-ink focus:ring-ring h-10 rounded-md border px-3 text-sm focus:ring-2 focus:outline-hidden"
                        >
                            <option value="all">All methods</option>
                            {Object.entries(methods).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {payments.data.length === 0 ? (
                    <EmptyState
                        icon={<Banknote className="h-6 w-6" />}
                        title={hasFilters ? 'No payments match your filters' : 'No payments recorded'}
                        description={
                            hasFilters
                                ? 'Try a different search term or payment method, or clear the filters to see everything.'
                                : 'Payments recorded against an invoice will appear here automatically.'
                        }
                        action={
                            hasFilters ? (
                                <Button variant="outline" onClick={() => router.get(route('payments.index'))}>
                                    Clear filters
                                </Button>
                            ) : (
                                <Button variant="outline" asChild>
                                    <Link href={route('invoices.index')}>View invoices</Link>
                                </Button>
                            )
                        }
                    />
                ) : (
                    <div className="border-hairline bg-surface overflow-hidden rounded-xl border">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead>
                                    <tr className="border-hairline bg-surface-2/60 text-ink-subtle border-b text-[11px] tracking-wide uppercase">
                                        <th className="px-5 py-3 font-medium">Date</th>
                                        <th className="px-5 py-3 font-medium">Invoice</th>
                                        <th className="px-5 py-3 font-medium">Customer</th>
                                        <th className="px-5 py-3 font-medium">Method</th>
                                        <th className="px-5 py-3 font-medium">Reference</th>
                                        <th className="px-5 py-3 text-right font-medium">Amount</th>
                                        {canDelete ? <th className="px-5 py-3 text-right font-medium">Actions</th> : null}
                                    </tr>
                                </thead>
                                <tbody className="divide-hairline-soft divide-y">
                                    {payments.data.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-canvas/40 transition-colors">
                                            <td className="text-ink-muted px-5 py-4 whitespace-nowrap">{formatDate(payment.paid_on)}</td>
                                            <td className="px-5 py-4">
                                                {payment.invoice_id ? (
                                                    <Link
                                                        href={route('invoices.show', payment.invoice_id)}
                                                        className="text-ink font-medium underline-offset-4 hover:underline"
                                                    >
                                                        {payment.invoice_number ?? `#${payment.invoice_id}`}
                                                    </Link>
                                                ) : (
                                                    <span className="text-ink-subtle">—</span>
                                                )}
                                            </td>
                                            <td className="text-ink px-5 py-4">{payment.customer_name ?? '—'}</td>
                                            <td className="text-ink-muted px-5 py-4">
                                                {payment.method_label ?? (payment.method ? methods[payment.method] : undefined) ?? '—'}
                                            </td>
                                            <td className="text-ink-subtle px-5 py-4">{payment.reference ?? '—'}</td>
                                            <td className="text-ink px-5 py-4 text-right font-medium tabular-nums">
                                                {formatMoney(payment.amount, currency)}
                                            </td>
                                            {canDelete ? (
                                                <td className="px-5 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => destroy(payment)}
                                                        className="text-ink-muted hover:text-danger h-8 px-2"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                                    </Button>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 pb-5">
                            <Pagination links={payments.links} from={payments.from} to={payments.to} total={payments.total} />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
