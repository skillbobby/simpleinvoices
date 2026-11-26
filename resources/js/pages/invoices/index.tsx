import EmptyState from '@/components/empty-state';
import InvoiceStatusBadge from '@/components/invoice-status-badge';
import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import SearchField from '@/components/search-field';
import StatCard from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney } from '@/lib/format';
import { type BreadcrumbItem, type InvoiceRow, type MetricSummary, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, Plus } from 'lucide-react';

interface InvoicesIndexProps {
    invoices: Paginated<InvoiceRow>;
    filters: { search: string; status: string };
    summary: { draft: MetricSummary; outstanding: MetricSummary; overdue: MetricSummary; paid: MetricSummary };
    currency: string;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Invoices', href: '/invoices' }];

const statuses = [
    { value: 'all', label: 'All invoices' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'partial', label: 'Partially paid' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'void', label: 'Void' },
];

export default function InvoicesIndex({ invoices, filters, summary, currency }: InvoicesIndexProps) {
    const applyFilters = (next: Partial<{ search: string; status: string }>) => {
        router.get(route('invoices.index'), { ...filters, ...next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices" />
            <div className="space-y-8">
                <PageHeader
                    title="Invoices"
                    description="Every invoice is numbered per company and carries its own payment ledger."
                    actions={
                        <Button asChild className="bg-ink hover:bg-ink/90 text-white">
                            <Link href={route('invoices.create')}>
                                <Plus className="h-4 w-4" /> New invoice
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Outstanding"
                        value={formatMoney(summary.outstanding.total, currency)}
                        hint={`${summary.outstanding.count} unpaid invoices`}
                        accent
                    />
                    <StatCard label="Overdue" value={formatMoney(summary.overdue.total, currency)} hint={`${summary.overdue.count} past due`} />
                    <StatCard label="Paid" value={formatMoney(summary.paid.total, currency)} hint={`${summary.paid.count} settled`} />
                    <StatCard label="Drafts" value={formatMoney(summary.draft.total, currency)} hint={`${summary.draft.count} not sent yet`} />
                </div>

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <SearchField
                        value={filters.search}
                        placeholder="Search number or customer…"
                        onSearch={(value) => applyFilters({ search: value })}
                    />
                    <select
                        value={filters.status}
                        onChange={(event) => applyFilters({ status: event.target.value })}
                        className="border-hairline bg-surface text-ink h-10 rounded-md border px-3 text-sm"
                    >
                        {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                </div>

                {invoices.data.length === 0 ? (
                    <EmptyState
                        icon={<FileText className="h-6 w-6" />}
                        title="No invoices match this view"
                        description="Adjust the filters, or create an invoice to get paid."
                        action={
                            <Button asChild className="bg-ink text-white">
                                <Link href={route('invoices.create')}>Create invoice</Link>
                            </Button>
                        }
                    />
                ) : (
                    <div className="border-hairline bg-surface overflow-hidden rounded-xl border">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-hairline text-ink-subtle border-b text-left text-[11px] tracking-wide uppercase">
                                        <th className="px-6 py-3 font-medium">Invoice</th>
                                        <th className="px-3 py-3 font-medium">Customer</th>
                                        <th className="px-3 py-3 font-medium">Status</th>
                                        <th className="px-3 py-3 font-medium">Issued</th>
                                        <th className="px-3 py-3 font-medium">Due</th>
                                        <th className="px-3 py-3 text-right font-medium">Total</th>
                                        <th className="px-6 py-3 text-right font-medium">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.data.map((invoice) => (
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
                                            <td className="text-ink-muted px-3 py-3.5">{formatDate(invoice.due_date)}</td>
                                            <td className="text-ink px-3 py-3.5 text-right">{formatMoney(invoice.total, currency)}</td>
                                            <td className="text-ink px-6 py-3.5 text-right">{formatMoney(invoice.balance, currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 pb-4">
                            <Pagination links={invoices.links} from={invoices.from} to={invoices.to} total={invoices.total} />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
