import InputError from '@/components/input-error';
import InvoiceStatusBadge from '@/components/invoice-status-badge';
import PageHeader from '@/components/page-header';
import StatCard from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney, todayISO } from '@/lib/format';
import { type BreadcrumbItem, type Invoice, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Copy, Download, Pencil, RotateCcw, Send, Trash2, XCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface CompanyPayload {
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string;
    tax_id: string | null;
    bank_details: string | null;
}

interface InvoiceShowProps {
    invoice: Invoice;
    company: CompanyPayload;
    paymentMethods: Record<string, string>;
}

export default function InvoiceShow({ invoice, company, paymentMethods }: InvoiceShowProps) {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = Boolean(auth?.user?.is_admin);
    const currency = invoice.currency_code;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Invoices', href: '/invoices' },
        { title: invoice.number, href: route('invoices.show', invoice.id) },
    ];

    const [copied, setCopied] = useState(false);

    const paymentForm = useForm({
        amount: invoice.balance,
        paid_on: todayISO(),
        method: 'bank_transfer',
        reference: '',
        notes: '',
    });

    const recordPayment: FormEventHandler = (event) => {
        event.preventDefault();
        paymentForm.post(route('invoices.payments.store', invoice.id), {
            preserveScroll: true,
            onSuccess: () => paymentForm.reset('reference', 'notes'),
        });
    };

    const copyLink = async () => {
        if (!invoice.share_url) {
            return;
        }

        try {
            await navigator.clipboard.writeText(invoice.share_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Copy this public invoice link', invoice.share_url);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={invoice.number} />
            <div className="space-y-8">
                <PageHeader
                    eyebrow={`Issued ${formatDate(invoice.issue_date)} · due ${formatDate(invoice.due_date)}`}
                    title={invoice.number}
                    description={`${invoice.customer_name} · ${formatMoney(invoice.total, currency)} total`}
                    actions={
                        <>
                            {invoice.is_editable ? (
                                <Button variant="outline" asChild className="border-hairline bg-surface text-ink hover:bg-surface-2">
                                    <Link href={route('invoices.edit', invoice.id)}>
                                        <Pencil className="h-4 w-4" /> Edit
                                    </Link>
                                </Button>
                            ) : null}
                            <Button variant="outline" asChild className="border-hairline bg-surface text-ink hover:bg-surface-2">
                                <a href={route('invoices.pdf', invoice.id)}>
                                    <Download className="h-4 w-4" /> PDF
                                </a>
                            </Button>
                            {invoice.status === 'draft' ? (
                                <Button
                                    className="bg-ink hover:bg-ink/90 text-white"
                                    onClick={() => router.post(route('invoices.send', invoice.id), {}, { preserveScroll: true })}
                                >
                                    <Send className="h-4 w-4" /> Mark as sent
                                </Button>
                            ) : null}
                        </>
                    }
                />

                <div className="flex flex-wrap items-center gap-2">
                    <InvoiceStatusBadge status={invoice.status} />
                    {invoice.is_overdue ? <span className="text-danger text-xs">Past due</span> : null}
                    <span className="text-ink-subtle text-xs">·</span>
                    <button
                        type="button"
                        onClick={() => router.post(route('invoices.duplicate', invoice.id))}
                        className="text-ink-muted hover:text-ink inline-flex items-center gap-1.5 text-xs"
                    >
                        <RotateCcw className="h-3.5 w-3.5" /> Duplicate
                    </button>
                    {invoice.share_url ? (
                        <>
                            <span className="text-ink-subtle text-xs">·</span>
                            <button
                                type="button"
                                onClick={copyLink}
                                className="text-ink-muted hover:text-ink inline-flex items-center gap-1.5 text-xs"
                            >
                                <Copy className="h-3.5 w-3.5" /> {copied ? 'Link copied' : 'Copy public link'}
                            </button>
                            <a
                                href={invoice.share_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-ink-muted text-xs underline-offset-4 hover:underline"
                            >
                                View public page
                            </a>
                        </>
                    ) : null}
                    {isAdmin && invoice.status !== 'void' ? (
                        <>
                            <span className="text-ink-subtle text-xs">·</span>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Void this invoice? The balance will be cleared.')) {
                                        router.post(route('invoices.void', invoice.id), {}, { preserveScroll: true });
                                    }
                                }}
                                className="text-ink-muted hover:text-danger inline-flex items-center gap-1.5 text-xs"
                            >
                                <XCircle className="h-3.5 w-3.5" /> Void
                            </button>
                        </>
                    ) : null}
                    {isAdmin ? (
                        <>
                            <span className="text-ink-subtle text-xs">·</span>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Delete this invoice permanently?')) {
                                        router.delete(route('invoices.destroy', invoice.id));
                                    }
                                }}
                                className="text-ink-muted hover:text-danger inline-flex items-center gap-1.5 text-xs"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                        </>
                    ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Total" value={formatMoney(invoice.total, currency)} />
                    <StatCard label="Paid" value={formatMoney(invoice.amount_paid, currency)} hint={`${invoice.payments.length} payments`} />
                    <StatCard
                        label="Balance due"
                        value={formatMoney(invoice.balance, currency)}
                        accent={invoice.balance > 0}
                        hint={invoice.balance > 0 ? 'Outstanding' : 'Settled'}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                    <section className="border-hairline bg-surface overflow-hidden rounded-xl border">
                        <div className="border-hairline flex flex-col justify-between gap-4 border-b px-8 py-7 sm:flex-row">
                            <div>
                                <p className="text-ink text-lg font-medium tracking-tight">{company.name}</p>
                                <p className="text-ink-muted mt-1 max-w-xs text-xs leading-relaxed">
                                    {company.address}
                                    {company.email ? (
                                        <>
                                            <br />
                                            {company.email}
                                        </>
                                    ) : null}
                                    {company.tax_id ? (
                                        <>
                                            <br />
                                            Tax ID {company.tax_id}
                                        </>
                                    ) : null}
                                </p>
                            </div>
                            <div className="sm:text-right">
                                <p className="text-ink-subtle text-[11px] tracking-[0.08em] uppercase">Invoice</p>
                                <p className="text-ink text-2xl font-medium tracking-tight">{invoice.number}</p>
                                <p className="text-ink-muted mt-1 text-xs">
                                    Issued {formatDate(invoice.issue_date)}
                                    <br />
                                    Due {formatDate(invoice.due_date)}
                                </p>
                            </div>
                        </div>

                        <div className="border-hairline grid gap-6 border-b px-8 py-6 sm:grid-cols-2">
                            <div>
                                <p className="text-ink-subtle text-[11px] tracking-[0.08em] uppercase">Billed to</p>
                                <p className="text-ink mt-2 text-sm font-medium">{invoice.customer_name}</p>
                                <p className="text-ink-muted mt-1 text-xs leading-relaxed whitespace-pre-line">{invoice.customer_address}</p>
                                {invoice.customer_email ? <p className="text-ink-muted text-xs">{invoice.customer_email}</p> : null}
                            </div>
                            <div className="sm:text-right">
                                <p className="text-ink-subtle text-[11px] tracking-[0.08em] uppercase">Amount due</p>
                                <p className="text-ink mt-2 text-2xl font-medium tracking-tight">{formatMoney(invoice.balance, currency)}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-hairline text-ink-subtle border-b text-left text-[11px] tracking-wide uppercase">
                                        <th className="px-8 py-3 font-medium">Description</th>
                                        <th className="px-3 py-3 text-right font-medium">Qty</th>
                                        <th className="px-3 py-3 text-right font-medium">Unit price</th>
                                        <th className="px-3 py-3 text-right font-medium">Tax</th>
                                        <th className="px-8 py-3 text-right font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item, index) => (
                                        <tr key={item.id ?? index} className="border-hairline-soft border-b last:border-0">
                                            <td className="text-ink px-8 py-3.5">{item.description}</td>
                                            <td className="text-ink-muted px-3 py-3.5 text-right">{item.quantity}</td>
                                            <td className="text-ink-muted px-3 py-3.5 text-right">{formatMoney(item.unit_price, currency)}</td>
                                            <td className="text-ink-muted px-3 py-3.5 text-right">{item.tax_rate ? `${item.tax_rate}%` : '—'}</td>
                                            <td className="text-ink px-8 py-3.5 text-right">{formatMoney(item.line_total ?? 0, currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-hairline flex flex-col gap-6 border-t px-8 py-6 sm:flex-row sm:justify-between">
                            <div className="text-ink-muted max-w-sm space-y-4 text-xs leading-relaxed">
                                {invoice.notes ? (
                                    <div>
                                        <p className="text-ink font-medium">Notes</p>
                                        <p className="mt-1 whitespace-pre-line">{invoice.notes}</p>
                                    </div>
                                ) : null}
                                {company.bank_details ? (
                                    <div>
                                        <p className="text-ink font-medium">Payment details</p>
                                        <p className="mt-1 whitespace-pre-line">{company.bank_details}</p>
                                    </div>
                                ) : null}
                                {invoice.terms ? (
                                    <div>
                                        <p className="text-ink font-medium">Terms</p>
                                        <p className="mt-1 whitespace-pre-line">{invoice.terms}</p>
                                    </div>
                                ) : null}
                            </div>
                            <div className="w-full space-y-2 text-sm sm:max-w-xs">
                                <div className="text-ink-muted flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-ink">{formatMoney(invoice.subtotal, currency)}</span>
                                </div>
                                {invoice.discount_amount > 0 ? (
                                    <div className="text-ink-muted flex justify-between">
                                        <span>Discount</span>
                                        <span className="text-ink">−{formatMoney(invoice.discount_amount, currency)}</span>
                                    </div>
                                ) : null}
                                <div className="text-ink-muted flex justify-between">
                                    <span>Tax</span>
                                    <span className="text-ink">{formatMoney(invoice.tax_total, currency)}</span>
                                </div>
                                <div className="border-hairline text-ink flex justify-between border-t pt-2 font-medium">
                                    <span>Total</span>
                                    <span>{formatMoney(invoice.total, currency)}</span>
                                </div>
                                <div className="text-ink-muted flex justify-between">
                                    <span>Paid</span>
                                    <span className="text-ink">−{formatMoney(invoice.amount_paid, currency)}</span>
                                </div>
                                <div className="border-ink text-ink flex justify-between border-t pt-2 text-base font-medium">
                                    <span>Balance due</span>
                                    <span>{formatMoney(invoice.balance, currency)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <section className="border-hairline bg-surface rounded-xl border p-5">
                            <h2 className="text-ink text-sm font-medium">Record a payment</h2>
                            {invoice.balance > 0 ? (
                                <form onSubmit={recordPayment} className="mt-4 space-y-3">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="amount" className="text-ink-muted text-xs">
                                            Amount ({currency})
                                        </Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            max={invoice.balance}
                                            value={paymentForm.data.amount}
                                            onChange={(event) => paymentForm.setData('amount', event.target.value as unknown as number)}
                                            className="border-hairline bg-surface"
                                        />
                                        <InputError message={paymentForm.errors.amount} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="paid_on" className="text-ink-muted text-xs">
                                            Date
                                        </Label>
                                        <Input
                                            id="paid_on"
                                            type="date"
                                            value={paymentForm.data.paid_on}
                                            onChange={(event) => paymentForm.setData('paid_on', event.target.value)}
                                            className="border-hairline bg-surface"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="method" className="text-ink-muted text-xs">
                                            Method
                                        </Label>
                                        <select
                                            id="method"
                                            value={paymentForm.data.method}
                                            onChange={(event) => paymentForm.setData('method', event.target.value)}
                                            className="border-hairline bg-surface text-ink h-10 rounded-md border px-3 text-sm"
                                        >
                                            {Object.entries(paymentMethods).map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="reference" className="text-ink-muted text-xs">
                                            Reference
                                        </Label>
                                        <Input
                                            id="reference"
                                            value={paymentForm.data.reference}
                                            onChange={(event) => paymentForm.setData('reference', event.target.value)}
                                            placeholder="Bank reference"
                                            className="border-hairline bg-surface"
                                        />
                                    </div>
                                    <Button type="submit" disabled={paymentForm.processing} className="bg-ink hover:bg-ink/90 w-full text-white">
                                        {paymentForm.processing ? 'Recording…' : 'Record payment'}
                                    </Button>
                                </form>
                            ) : (
                                <p className="bg-ok-soft text-ok mt-3 rounded-lg px-3 py-2 text-xs">This invoice is settled.</p>
                            )}
                        </section>

                        <section className="border-hairline bg-surface rounded-xl border p-5">
                            <h2 className="text-ink text-sm font-medium">Payment history</h2>
                            {invoice.payments.length === 0 ? (
                                <p className="text-ink-muted mt-3 text-xs">No payments recorded yet.</p>
                            ) : (
                                <div className="mt-3 space-y-2">
                                    {invoice.payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="border-hairline-soft flex items-start justify-between rounded-lg border px-3 py-2.5"
                                        >
                                            <div>
                                                <p className="text-ink text-xs font-medium">{formatMoney(payment.amount, currency)}</p>
                                                <p className="text-ink-subtle text-[11px]">
                                                    {formatDate(payment.paid_on)} · {payment.method_label}
                                                </p>
                                                {payment.reference ? <p className="text-ink-subtle text-[11px]">{payment.reference}</p> : null}
                                            </div>
                                            {isAdmin ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (confirm('Delete this payment? The invoice balance will be recalculated.')) {
                                                            router.delete(route('payments.destroy', payment.id), { preserveScroll: true });
                                                        }
                                                    }}
                                                    className="text-ink-subtle hover:text-danger"
                                                    aria-label="Delete payment"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="border-hairline bg-canvas text-ink-muted rounded-xl border p-5 text-xs leading-relaxed">
                            <p className="text-ink font-medium">Share with your client</p>
                            {invoice.share_url ? (
                                <p className="mt-2 text-[11px] break-all">{invoice.share_url}</p>
                            ) : (
                                <p className="mt-2">Mark the invoice as sent to generate a public link.</p>
                            )}
                        </section>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
