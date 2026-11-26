import EmptyState from '@/components/empty-state';
import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import SearchField from '@/components/search-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Customer, type Paginated } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Users } from 'lucide-react';

interface CustomersIndexProps {
    customers: Paginated<Customer>;
    filters: { search: string; status: string };
}

const breadcrumbs = [{ title: 'Customers', href: '/customers' }];

export default function CustomersIndex({ customers, filters }: CustomersIndexProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { tenant } = usePage().props as any;
    const currency = tenant?.currency_code ?? 'USD';
    const status = filters.status || 'all';
    const hasFilters = filters.search.trim() !== '' || status !== 'all';

    const applyFilters = (next: { search: string; status: string }) => {
        router.get(route('customers.index'), next, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customers" />
            <div className="space-y-6">
                <PageHeader
                    eyebrow="Directory"
                    title="Customers"
                    description="Everyone your company bills, with lifetime totals and outstanding balances in one place."
                    actions={
                        <>
                            <Button variant="outline" className="bg-surface" asChild>
                                <Link href={route('invoices.create')}>New invoice</Link>
                            </Button>
                            <Button asChild>
                                <Link href={route('customers.create')}>
                                    <Plus /> New customer
                                </Link>
                            </Button>
                        </>
                    }
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SearchField
                        value={filters.search}
                        placeholder="Search name, company, email…"
                        onSearch={(value) => applyFilters({ search: value, status })}
                    />
                    <select
                        value={status}
                        onChange={(event) => applyFilters({ search: filters.search, status: event.target.value })}
                        aria-label="Filter customers by status"
                        className="border-hairline bg-surface text-ink focus-visible:ring-ring h-10 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-hidden"
                    >
                        <option value="all">All customers</option>
                        <option value="active">Active</option>
                        <option value="inactive">Archived</option>
                    </select>
                </div>

                {customers.data.length === 0 ? (
                    <EmptyState
                        icon={<Users className="h-7 w-7" />}
                        title={hasFilters ? 'No customers match your filters' : 'No customers yet'}
                        description={
                            hasFilters
                                ? 'Try a different search term or clear the status filter to see everyone.'
                                : 'Add your first customer to start raising invoices and tracking payments.'
                        }
                        action={
                            hasFilters ? (
                                <Button variant="outline" className="bg-surface" onClick={() => applyFilters({ search: '', status: 'all' })}>
                                    Clear filters
                                </Button>
                            ) : (
                                <Button asChild>
                                    <Link href={route('customers.create')}>
                                        <Plus /> Add your first customer
                                    </Link>
                                </Button>
                            )
                        }
                    />
                ) : (
                    <div className="border-hairline bg-surface overflow-hidden rounded-xl border">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-hairline text-ink-subtle border-b text-[11px] tracking-wide uppercase">
                                        <th className="px-3 py-3 text-left font-medium">Customer</th>
                                        <th className="px-3 py-3 text-left font-medium">Contact</th>
                                        <th className="px-3 py-3 text-left font-medium">Location</th>
                                        <th className="px-3 py-3 text-right font-medium">Invoices</th>
                                        <th className="px-3 py-3 text-right font-medium">Billed</th>
                                        <th className="px-3 py-3 text-right font-medium">Outstanding</th>
                                        <th className="px-3 py-3 text-right font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.data.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            className="border-hairline-soft hover:bg-canvas/60 border-b transition-colors last:border-0"
                                        >
                                            <td className="px-3 py-3">
                                                <Link href={route('customers.show', customer.id)} className="text-ink font-medium hover:underline">
                                                    {customer.name}
                                                </Link>
                                                <p className="text-ink-muted mt-0.5 text-xs">{customer.company_name || '—'}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <p className="text-ink-muted">{customer.email || '—'}</p>
                                                {customer.phone ? <p className="text-ink-subtle mt-0.5 text-xs">{customer.phone}</p> : null}
                                            </td>
                                            <td className="text-ink-muted px-3 py-3">
                                                {[customer.city, customer.country].filter(Boolean).join(', ') || '—'}
                                            </td>
                                            <td className="text-ink-muted px-3 py-3 text-right tabular-nums">{customer.invoices_count ?? 0}</td>
                                            <td className="text-ink px-3 py-3 text-right tabular-nums">
                                                {formatMoney(customer.billed_total, currency)}
                                            </td>
                                            <td
                                                className={cn(
                                                    'px-3 py-3 text-right tabular-nums',
                                                    (customer.outstanding_balance ?? 0) > 0 ? 'text-ink font-medium' : 'text-ink-muted',
                                                )}
                                            >
                                                {formatMoney(customer.outstanding_balance, currency)}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'font-medium',
                                                        customer.is_active
                                                            ? 'bg-ok-soft text-ok border-transparent'
                                                            : 'border-hairline bg-surface-2 text-ink-muted',
                                                    )}
                                                >
                                                    {customer.is_active ? 'Active' : 'Archived'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 pb-4">
                            <Pagination links={customers.links} from={customers.from} to={customers.to} total={customers.total} />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
