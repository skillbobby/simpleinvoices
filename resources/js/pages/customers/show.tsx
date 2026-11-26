import EmptyState from '@/components/empty-state';
import InvoiceStatusBadge from '@/components/invoice-status-badge';
import PageHeader from '@/components/page-header';
import StatCard from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type Customer, type InvoiceRow, type Payment } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FileText, Pencil, Plus, Receipt, Trash2 } from 'lucide-react';

interface CustomerShowProps {
    customer: Customer;
    invoices: InvoiceRow[];
    payments: Payment[];
    stats: {
        billed_total: number;
        outstanding: number;
        paid_total: number;
        invoices_count: number;
    };
}

export default function ShowCustomer({ customer, invoices, payments, stats }: CustomerShowProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { tenant } = usePage().props as any;
    const currency = tenant?.currency_code ?? 'USD';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Customers', href: '/customers' },
        { title: customer.name, href: route('customers.show', customer.id) },
    ];

    const contactLine = [customer.email, customer.phone].filter(Boolean).join(' · ');
    const address =
        customer.full_address ||
        [customer.address_line1, customer.address_line2, customer.city, customer.state, customer.postal_code, customer.country]
            .filter(Boolean)
            .join(', ');

    const destroy = () => {
        if (!confirm(`Delete ${customer.name}? Customers with invoices are archived instead of deleted.`)) {
            return;
        }

        router.delete(route('customers.destroy', customer.id), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={customer.name} />
            <div className="space-y-6">
                <PageHeader
                    eyebrow={customer.company_name || 'Customer'}
                    title={customer.name}
                    description={contactLine || 'No contact details on file yet.'}
                    actions={
                        <>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'mr-1 font-medium',
                                    customer.is_active ? 'bg-ok-soft text-ok border-transparent' : 'border-hairline bg-surface-2 text-ink-muted',
                                )}
                            >
                                {customer.is_active ? 'Active' : 'Archived'}
                            </Badge>
                            <Button variant="outline" className="bg-surface" asChild>
                                <Link href={route('customers.edit', customer.id)}>
                                    <Pencil /> Edit
                                </Link>
                            </Button>
                            <Button className="bg-ink hover:bg-ink/90 text-white" asChild>
                                <Link href={route('invoices.create', { customer_id: customer.id })}>
                                    <Plus /> New invoice
                                </Link>
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Billed total"
                        value={formatMoney(stats.billed_total, currency)}
                        hint={`${stats.invoices_count} ${stats.invoices_count === 1 ? 'invoice' : 'invoices'} raised`}
                    />
                    <StatCard label="Outstanding" value={formatMoney(stats.outstanding, currency)} hint="Balance across open invoices" accent />
                    <StatCard label="Paid to date" value={formatMoney(stats.paid_total, currency)} hint="Payments recorded" />
                    <StatCard label="Invoices" value={stats.invoices_count} hint={customer.is_active ? 'Active customer' : 'Archived customer'} />
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="space-y-5">
                        <section className="space-y-3">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h2 className="text-ink text-lg font-medium">Recent invoices</h2>
                                    <p className="text-ink-muted text-xs">Latest billing activity for this customer.</p>
                                </div>
                                {invoices.length > 0 ? (
                                    <Button variant="outline" size="sm" className="bg-surface" asChild>
                                        <Link href={route('invoices.index')}>View all</Link>
                                    </Button>
                                ) : null}
                            </div>

                            {invoices.length > 0 ? (
                                <div className="border-hairline bg-surface overflow-hidden rounded-xl border">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-hairline text-ink-subtle border-b text-[11px] tracking-wide uppercase">
                                                    <th className="px-3 py-3 text-left font-medium">Invoice</th>
                                                    <th className="px-3 py-3 text-left font-medium">Status</th>
                                                    <th className="px-3 py-3 text-left font-medium">Issued</th>
                                                    <th className="px-3 py-3 text-left font-medium">Due</th>
                                                    <th className="px-3 py-3 text-right font-medium">Total</th>
                                                    <th className="px-3 py-3 text-right font-medium">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoices.map((invoice) => (
                                                    <tr
                                                        key={invoice.id}
                                                        className="border-hairline-soft hover:bg-canvas/60 border-b transition-colors last:border-0"
                                                    >
                                                        <td className="px-3 py-3">
                                                            <Link
                                                                href={route('invoices.show', invoice.id)}
                                                                className="text-ink font-medium hover:underline"
                                                            >
                                                                {invoice.number}
                                                            </Link>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <InvoiceStatusBadge status={invoice.status} />
                                                        </td>
                                                        <td className="text-ink-muted px-3 py-3">{formatDate(invoice.issue_date)}</td>
                                                        <td className="text-ink-muted px-3 py-3">{formatDate(invoice.due_date)}</td>
                                                        <td className="text-ink px-3 py-3 text-right tabular-nums">
                                                            {formatMoney(invoice.total, currency)}
                                                        </td>
                                                        <td
                                                            className={cn(
                                                                'px-3 py-3 text-right tabular-nums',
                                                                invoice.balance > 0 ? 'text-ink font-medium' : 'text-ink-muted',
                                                            )}
                                                        >
                                                            {formatMoney(invoice.balance, currency)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<FileText className="h-7 w-7" />}
                                    title="No invoices yet"
                                    description="Raise the first invoice for this customer and it will show up here."
                                    action={
                                        <Button asChild>
                                            <Link href={route('invoices.create', { customer_id: customer.id })}>
                                                <Plus /> New invoice
                                            </Link>
                                        </Button>
                                    }
                                />
                            )}
                        </section>
                        <section className="space-y-3">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h2 className="text-ink text-lg font-medium">Payments</h2>
                                    <p className="text-ink-muted text-xs">Payments recorded against this customer&apos;s invoices.</p>
                                </div>
                                {payments.length > 0 ? (
                                    <span className="text-ink-muted text-xs">
                                        {payments.length} recent {payments.length === 1 ? 'payment' : 'payments'}
                                    </span>
                                ) : null}
                            </div>

                            {payments.length > 0 ? (
                                <div className="divide-hairline-soft border-hairline bg-surface divide-y overflow-hidden rounded-xl border">
                                    {payments.map((payment) => (
                                        <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                                            <div>
                                                <p className="text-ink text-sm font-medium">{formatMoney(payment.amount, currency)}</p>
                                                <p className="text-ink-muted mt-0.5 text-xs">
                                                    {formatDate(payment.paid_on)}
                                                    {payment.method ? ` · ${payment.method}` : ''}
                                                    {payment.reference ? ` · ${payment.reference}` : ''}
                                                </p>
                                            </div>
                                            {payment.invoice_id ? (
                                                <Link
                                                    href={route('invoices.show', payment.invoice_id)}
                                                    className="text-ink-muted hover:text-ink text-xs font-medium underline-offset-2 hover:underline"
                                                >
                                                    {payment.invoice_number ?? `Invoice #${payment.invoice_id}`}
                                                </Link>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<Receipt className="h-7 w-7" />}
                                    title="No payments yet"
                                    description="Payments recorded against this customer's invoices will be listed here."
                                />
                            )}
                        </section>
                    </div>
                    <aside className="space-y-5">
                        <section className="border-hairline bg-surface rounded-xl border p-5">
                            <h2 className="text-ink text-sm font-medium">Contact</h2>
                            <dl className="mt-4 space-y-3 text-sm">
                                <div>
                                    <dt className="text-ink-subtle text-xs">Email</dt>
                                    <dd className="mt-0.5 break-words">
                                        {customer.email ? (
                                            <a href={`mailto:${customer.email}`} className="text-ink hover:underline">
                                                {customer.email}
                                            </a>
                                        ) : (
                                            <span className="text-ink-muted">Not provided</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-ink-subtle text-xs">Phone</dt>
                                    <dd className="text-ink mt-0.5">{customer.phone || <span className="text-ink-muted">Not provided</span>}</dd>
                                </div>
                                <div>
                                    <dt className="text-ink-subtle text-xs">Mobile</dt>
                                    <dd className="text-ink mt-0.5">{customer.mobile || <span className="text-ink-muted">Not provided</span>}</dd>
                                </div>
                                <div>
                                    <dt className="text-ink-subtle text-xs">Customer since</dt>
                                    <dd className="text-ink mt-0.5">{formatDate(customer.created_at)}</dd>
                                </div>
                            </dl>
                        </section>

                        <section className="border-hairline bg-surface rounded-xl border p-5">
                            <h2 className="text-ink text-sm font-medium">Billing address</h2>
                            <p className="text-ink-muted mt-3 text-sm leading-relaxed whitespace-pre-line">
                                {address || 'No billing address on file.'}
                            </p>
                            {customer.tax_id ? (
                                <div className="border-hairline-soft mt-4 border-t pt-3">
                                    <p className="text-ink-subtle text-xs">Tax ID</p>
                                    <p className="text-ink mt-0.5 text-sm">{customer.tax_id}</p>
                                </div>
                            ) : null}
                        </section>
                        <section className="border-hairline bg-surface rounded-xl border p-5">
                            <h2 className="text-ink text-sm font-medium">Notes</h2>
                            <p className="text-ink-muted mt-3 text-sm leading-relaxed whitespace-pre-line">
                                {customer.notes?.trim() ? customer.notes : 'No notes for this customer.'}
                            </p>
                        </section>

                        <section className="border-hairline bg-surface rounded-xl border p-5">
                            <h2 className="text-ink text-sm font-medium">Account</h2>
                            <div className="mt-4 flex items-center justify-between gap-3">
                                <span className="text-ink-muted text-sm">Status</span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'font-medium',
                                        customer.is_active ? 'bg-ok-soft text-ok border-transparent' : 'border-hairline bg-surface-2 text-ink-muted',
                                    )}
                                >
                                    {customer.is_active ? 'Active' : 'Archived'}
                                </Badge>
                            </div>
                            <p className="text-ink-muted mt-3 text-xs leading-relaxed">
                                Customers are private to your company and never shared across companies.
                            </p>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={destroy}
                                className="text-danger hover:bg-danger-soft hover:text-danger mt-4 w-full justify-start px-2"
                            >
                                <Trash2 /> Delete customer
                            </Button>
                        </section>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
