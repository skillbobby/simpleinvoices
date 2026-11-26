import InvoiceStatusBadge from '@/components/invoice-status-badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatMoney } from '@/lib/format';
import { Head } from '@inertiajs/react';
import { Download, Printer } from 'lucide-react';

interface PublicInvoice {
    number: string;
    status: string;
    issue_date: string;
    due_date: string;
    currency_code: string;
    customer_name: string;
    customer_email: string | null;
    customer_address: string | null;
    subtotal: number;
    discount_amount: number;
    tax_total: number;
    total: number;
    amount_paid: number;
    balance: number;
    notes: string | null;
    terms: string | null;
    footer: string | null;
    items: Array<{
        description: string;
        quantity: number;
        unit: string;
        unit_price: number;
        tax_rate: number;
        tax_amount: number;
        line_total: number;
    }>;
    payments: Array<{ paid_on: string; amount: number; method_label: string }>;
    pdf_url: string;
}

interface CompanyPayload {
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string;
    tax_id: string | null;
    bank_details: string | null;
    invoice_footer: string | null;
}

interface PublicInvoiceProps {
    invoice: PublicInvoice;
    company: CompanyPayload;
}

export default function PublicInvoice({ invoice, company }: PublicInvoiceProps) {
    return (
        <>
            <Head title={`Invoice ${invoice.number}`} />
            <div className="bg-canvas min-h-svh px-4 py-10 sm:px-6 md:py-16">
                <div className="mx-auto max-w-3xl">
                    <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-ink-muted flex items-center gap-3 text-sm">
                            <span className="text-ink">{company.name}</span>
                            <InvoiceStatusBadge status={invoice.status} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                                className="border-hairline bg-surface text-ink hover:bg-surface-2"
                            >
                                <Printer className="h-4 w-4" /> Print
                            </Button>
                            <Button asChild className="bg-ink hover:bg-ink/90 text-white">
                                <a href={invoice.pdf_url}>
                                    <Download className="h-4 w-4" /> Download PDF
                                </a>
                            </Button>
                        </div>
                    </div>

                    <article className="border-hairline bg-surface overflow-hidden rounded-xl border">
                        <header className="border-hairline flex flex-col justify-between gap-6 border-b px-8 py-8 sm:flex-row">
                            <div>
                                <p className="text-ink text-xl font-medium tracking-tight">{company.name}</p>
                                <p className="text-ink-muted mt-1 max-w-xs text-xs leading-relaxed">
                                    {company.address}
                                    {company.email ? (
                                        <>
                                            <br />
                                            {company.email}
                                        </>
                                    ) : null}
                                    {company.phone ? (
                                        <>
                                            <br />
                                            {company.phone}
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
                        </header>

                        <div className="border-hairline grid gap-6 border-b px-8 py-6 sm:grid-cols-2">
                            <div>
                                <p className="text-ink-subtle text-[11px] tracking-[0.08em] uppercase">Billed to</p>
                                <p className="text-ink mt-2 text-sm font-medium">{invoice.customer_name}</p>
                                <p className="text-ink-muted mt-1 text-xs leading-relaxed whitespace-pre-line">{invoice.customer_address}</p>
                                {invoice.customer_email ? <p className="text-ink-muted text-xs">{invoice.customer_email}</p> : null}
                            </div>
                            <div className="sm:text-right">
                                <p className="text-ink-subtle text-[11px] tracking-[0.08em] uppercase">Amount due</p>
                                <p className="text-ink mt-2 text-2xl font-medium tracking-tight">
                                    {formatMoney(invoice.balance, invoice.currency_code)}
                                </p>
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
                                        <tr key={index} className="border-hairline-soft border-b last:border-0">
                                            <td className="text-ink px-8 py-3.5">{item.description}</td>
                                            <td className="text-ink-muted px-3 py-3.5 text-right">{item.quantity}</td>
                                            <td className="text-ink-muted px-3 py-3.5 text-right">
                                                {formatMoney(item.unit_price, invoice.currency_code)}
                                            </td>
                                            <td className="text-ink-muted px-3 py-3.5 text-right">{item.tax_rate ? `${item.tax_rate}%` : '—'}</td>
                                            <td className="text-ink px-8 py-3.5 text-right">{formatMoney(item.line_total, invoice.currency_code)}</td>
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
                                    <span className="text-ink">{formatMoney(invoice.subtotal, invoice.currency_code)}</span>
                                </div>
                                {invoice.discount_amount > 0 ? (
                                    <div className="text-ink-muted flex justify-between">
                                        <span>Discount</span>
                                        <span className="text-ink">−{formatMoney(invoice.discount_amount, invoice.currency_code)}</span>
                                    </div>
                                ) : null}
                                <div className="text-ink-muted flex justify-between">
                                    <span>Tax</span>
                                    <span className="text-ink">{formatMoney(invoice.tax_total, invoice.currency_code)}</span>
                                </div>
                                <div className="border-hairline text-ink flex justify-between border-t pt-2 font-medium">
                                    <span>Total</span>
                                    <span>{formatMoney(invoice.total, invoice.currency_code)}</span>
                                </div>
                                <div className="text-ink-muted flex justify-between">
                                    <span>Paid</span>
                                    <span className="text-ink">−{formatMoney(invoice.amount_paid, invoice.currency_code)}</span>
                                </div>
                                <div className="border-ink text-ink flex justify-between border-t pt-2 text-base font-medium">
                                    <span>Balance due</span>
                                    <span>{formatMoney(invoice.balance, invoice.currency_code)}</span>
                                </div>
                            </div>
                        </div>

                        <footer className="border-hairline text-ink-subtle border-t px-8 py-4 text-[11px]">
                            {invoice.footer || company.invoice_footer}
                        </footer>
                    </article>

                    <p className="text-ink-subtle no-print mt-4 text-center text-[11px]">
                        Secured by Simple Invoices · this link is unique to invoice {invoice.number}
                    </p>
                </div>
            </div>
        </>
    );
}
