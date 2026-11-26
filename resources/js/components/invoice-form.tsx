import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addDaysISO, formatMoney, todayISO } from '@/lib/format';
import { type Invoice, type PaymentTerm, type TaxRate } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

interface CustomerOption {
    id: number;
    name: string;
    company_name: string | null;
    email: string | null;
    address: string;
}

interface ProductOption {
    id: number;
    name: string;
    sku: string | null;
    unit_price: number;
    unit: string;
    tax_rate_id: number | null;
    tax_rate: number;
}

interface LineItemForm {
    [key: string]: string | number | null;
    description: string;
    quantity: number | string;
    unit_price: number | string;
    unit: string;
    tax_rate_id: number | string | '';
    product_id: number | null;
}

interface InvoiceFormData {
    [key: string]: string | number | LineItemForm[] | null;
    customer_id: number | '';
    payment_term_id: number | '';
    issue_date: string;
    due_date: string;
    currency_code: string;
    discount_type: 'none' | 'fixed' | 'percent';
    discount_value: number | string;
    notes: string;
    terms: string;
    footer: string;
    status: 'draft' | 'sent';
    items: LineItemForm[];
}

export interface InvoiceFormProps {
    customers: CustomerOption[];
    products: ProductOption[];
    taxRates: TaxRate[];
    paymentTerms: PaymentTerm[];
    defaults: {
        issue_date: string;
        due_date: string;
        currency_code: string;
        notes: string | null;
        terms: string | null;
        footer: string | null;
        next_number: string;
    };
    invoice?: Invoice;
}

const emptyLine = (product?: ProductOption): LineItemForm => ({
    description: product?.name ?? '',
    quantity: 1,
    unit_price: product?.unit_price ?? 0,
    unit: product?.unit ?? 'unit',
    tax_rate_id: product?.tax_rate_id ?? '',
    product_id: product?.id ?? null,
});

export default function InvoiceForm({ customers, products, taxRates, paymentTerms, defaults, invoice }: InvoiceFormProps) {
    const editing = Boolean(invoice);
    const initialItems: LineItemForm[] = invoice?.items?.length
        ? invoice.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              unit: item.unit ?? 'unit',
              tax_rate_id: item.tax_rate_id ?? '',
              product_id: item.product_id ?? null,
          }))
        : [emptyLine()];

    const form = useForm<InvoiceFormData>({
        customer_id: invoice?.customer_id ?? ('' as number | ''),
        payment_term_id: (invoice?.payment_term_id ?? paymentTerms.find((term) => term.is_default)?.id ?? '') as number | '',
        issue_date: invoice?.issue_date ?? defaults.issue_date,
        due_date: invoice?.due_date ?? defaults.due_date,
        currency_code: invoice?.currency_code ?? defaults.currency_code,
        discount_type: (invoice?.discount_type ?? 'none') as 'none' | 'fixed' | 'percent',
        discount_value: invoice?.discount_value ?? 0,
        notes: invoice?.notes ?? defaults.notes ?? '',
        terms: invoice?.terms ?? defaults.terms ?? '',
        footer: invoice?.footer ?? defaults.footer ?? '',
        status: invoice?.status === 'sent' ? 'sent' : 'draft',
        items: initialItems,
    });

    const [pickProduct, setPickProduct] = useState<number | ''>('');
    const currency = form.data.currency_code || 'USD';

    const totals = useMemo(() => {
        const lines = form.data.items.map((item) => {
            const quantity = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            const rate = taxRates.find((tax) => String(tax.id) === String(item.tax_rate_id))?.rate ?? 0;

            return { subtotal: Math.round(quantity * price * 100) / 100, rate };
        });

        const subtotal = Math.round(lines.reduce((sum, line) => sum + line.subtotal, 0) * 100) / 100;
        const discountValue = Number(form.data.discount_value) || 0;
        const discountAmount =
            form.data.discount_type === 'percent'
                ? Math.round(subtotal * (Math.min(discountValue, 100) / 100) * 100) / 100
                : form.data.discount_type === 'fixed'
                  ? Math.round(Math.min(discountValue, subtotal) * 100) / 100
                  : 0;
        const ratio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 0;
        const tax = Math.round(lines.reduce((sum, line) => sum + Math.round(line.subtotal * ratio * (line.rate / 100) * 100) / 100, 0) * 100) / 100;

        return { subtotal, discountAmount, tax, total: Math.round((subtotal - discountAmount + tax) * 100) / 100 };
    }, [form.data.items, form.data.discount_type, form.data.discount_value, taxRates]);

    const setItem = (index: number, key: keyof LineItemForm, value: string | number | null) => {
        const next = form.data.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item));
        form.setData('items', next);
    };

    const addProduct = () => {
        const product = products.find((item) => item.id === Number(pickProduct));
        if (!product) {
            return;
        }

        form.setData('items', [...form.data.items, emptyLine(product)]);
        setPickProduct('');
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (editing && invoice) {
            form.patch(route('invoices.update', invoice.id), { preserveScroll: true });
        } else {
            form.post(route('invoices.store'), { preserveScroll: true });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="space-y-6">
                    <section className="border-hairline bg-surface rounded-xl border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-ink text-lg font-medium">Invoice details</h2>
                                <p className="text-ink-muted text-sm">
                                    {editing ? `Editing ${invoice?.number}` : `Next number ${defaults.next_number}`}
                                </p>
                            </div>
                            <span className="border-hairline bg-canvas text-ink-muted rounded-full border px-3 py-1 text-[11px]">
                                {defaults.currency_code}
                            </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="customer_id">Customer</Label>
                                <select
                                    id="customer_id"
                                    value={form.data.customer_id}
                                    onChange={(event) => form.setData('customer_id', event.target.value ? Number(event.target.value) : '')}
                                    className="border-hairline bg-surface text-ink h-10 rounded-md border px-3 text-sm"
                                >
                                    <option value="">Select a customer…</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.company_name ? `${customer.company_name} — ${customer.name}` : customer.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.customer_id} />
                                {customers.length === 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => router.visit(route('customers.create'))}
                                        className="text-ink-muted text-left text-xs underline underline-offset-4"
                                    >
                                        Add a customer first
                                    </button>
                                ) : null}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="issue_date">Issue date</Label>
                                <Input
                                    id="issue_date"
                                    type="date"
                                    value={form.data.issue_date}
                                    onChange={(event) => form.setData('issue_date', event.target.value)}
                                    className="border-hairline bg-surface"
                                />
                                <InputError message={form.errors.issue_date} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="due_date">Due date</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={form.data.due_date}
                                    onChange={(event) => form.setData('due_date', event.target.value)}
                                    className="border-hairline bg-surface"
                                />
                                <InputError message={form.errors.due_date} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="payment_term_id">Payment terms</Label>
                                <select
                                    id="payment_term_id"
                                    value={form.data.payment_term_id}
                                    onChange={(event) => {
                                        const id = event.target.value ? Number(event.target.value) : '';
                                        form.setData('payment_term_id', id);
                                        const term = paymentTerms.find((item) => item.id === id);
                                        if (term) {
                                            form.setData('due_date', addDaysISO(term.days, form.data.issue_date || todayISO()));
                                        }
                                    }}
                                    className="border-hairline bg-surface text-ink h-10 rounded-md border px-3 text-sm"
                                >
                                    <option value="">Custom</option>
                                    {paymentTerms.map((term) => (
                                        <option key={term.id} value={term.id}>
                                            {term.name} ({term.days} days)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    value={form.data.status}
                                    onChange={(event) => form.setData('status', event.target.value as 'draft' | 'sent')}
                                    className="border-hairline bg-surface text-ink h-10 rounded-md border px-3 text-sm"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="sent">Send on save</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="border-hairline bg-surface rounded-xl border">
                        <div className="border-hairline flex flex-col gap-3 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-ink text-lg font-medium">Line items</h2>
                                <p className="text-ink-muted text-sm">Tax is calculated on the discounted value.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={pickProduct}
                                    onChange={(event) => setPickProduct(event.target.value ? Number(event.target.value) : '')}
                                    className="border-hairline bg-surface text-ink h-9 rounded-md border px-2 text-sm"
                                >
                                    <option value="">Add from catalog…</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                                <Button type="button" variant="outline" size="sm" onClick={addProduct} className="border-hairline bg-surface">
                                    <Plus className="h-3.5 w-3.5" /> Add
                                </Button>
                            </div>
                        </div>

                        <div className="divide-hairline-soft divide-y">
                            {form.data.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="grid gap-3 px-6 py-4 md:grid-cols-[minmax(0,1fr)_90px_130px_150px_120px_40px] md:items-start"
                                >
                                    <div className="grid gap-1">
                                        <Input
                                            value={item.description}
                                            onChange={(event) => setItem(index, 'description', event.target.value)}
                                            placeholder="Description"
                                            className="border-hairline bg-surface"
                                        />
                                        <InputError message={(form.errors as Record<string, string>)[`items.${index}.description`]} />
                                    </div>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.quantity}
                                        onChange={(event) => setItem(index, 'quantity', event.target.value)}
                                        className="border-hairline bg-surface text-right"
                                        aria-label="Quantity"
                                    />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.unit_price}
                                        onChange={(event) => setItem(index, 'unit_price', event.target.value)}
                                        className="border-hairline bg-surface text-right"
                                        aria-label="Unit price"
                                    />
                                    <select
                                        value={item.tax_rate_id}
                                        onChange={(event) => setItem(index, 'tax_rate_id', event.target.value ? Number(event.target.value) : '')}
                                        className="border-hairline bg-surface text-ink h-10 rounded-md border px-2 text-sm"
                                        aria-label="Tax rate"
                                    >
                                        <option value="">No tax</option>
                                        {taxRates.map((tax) => (
                                            <option key={tax.id} value={tax.id}>
                                                {tax.name} · {tax.rate}%
                                            </option>
                                        ))}
                                    </select>
                                    <div className="text-ink text-right text-sm md:pt-2.5">
                                        {formatMoney(Number(item.quantity) * Number(item.unit_price), currency)}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            form.setData(
                                                'items',
                                                form.data.items.filter((_, itemIndex) => itemIndex !== index),
                                            )
                                        }
                                        disabled={form.data.items.length === 1}
                                        className="text-ink-subtle hover:text-danger"
                                        aria-label="Remove line"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="border-hairline flex items-center justify-between border-t px-6 py-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => form.setData('items', [...form.data.items, emptyLine()])}
                                className="text-ink-muted"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add line item
                            </Button>
                            <p className="text-ink-muted text-sm">
                                Subtotal <span className="text-ink ml-2">{formatMoney(totals.subtotal, currency)}</span>
                            </p>
                        </div>
                        <InputError message={form.errors.items as string} className="px-6 pb-4" />
                    </section>

                    <section className="border-hairline bg-surface grid gap-6 rounded-xl border p-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes shown on the invoice</Label>
                            <textarea
                                id="notes"
                                rows={4}
                                value={form.data.notes ?? ''}
                                onChange={(event) => form.setData('notes', event.target.value)}
                                className="border-hairline bg-surface text-ink rounded-md border px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="terms">Payment terms</Label>
                            <textarea
                                id="terms"
                                rows={4}
                                value={form.data.terms ?? ''}
                                onChange={(event) => form.setData('terms', event.target.value)}
                                className="border-hairline bg-surface text-ink rounded-md border px-3 py-2 text-sm"
                            />
                        </div>
                    </section>
                </div>

                <aside className="space-y-4">
                    <section className="border-hairline bg-surface rounded-xl border p-6">
                        <h2 className="text-ink text-sm font-medium">Summary</h2>
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="text-ink-muted flex justify-between">
                                <span>Subtotal</span>
                                <span className="text-ink">{formatMoney(totals.subtotal, currency)}</span>
                            </div>
                            <div className="border-hairline-soft space-y-2 border-t pt-2">
                                <div className="text-ink-muted flex items-center justify-between gap-2">
                                    <span>Discount</span>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={form.data.discount_type}
                                            onChange={(event) => form.setData('discount_type', event.target.value as 'none' | 'fixed' | 'percent')}
                                            className="border-hairline bg-surface text-ink h-8 rounded-md border px-1.5 text-xs"
                                        >
                                            <option value="none">None</option>
                                            <option value="percent">%</option>
                                            <option value="fixed">Amount</option>
                                        </select>
                                        {form.data.discount_type !== 'none' ? (
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={form.data.discount_value}
                                                onChange={(event) => form.setData('discount_value', event.target.value)}
                                                className="border-hairline bg-surface h-8 w-20 text-right text-xs"
                                            />
                                        ) : null}
                                    </div>
                                </div>
                                {form.data.discount_type !== 'none' ? (
                                    <div className="text-ink-subtle flex justify-between text-xs">
                                        <span>Discount applied</span>
                                        <span>−{formatMoney(totals.discountAmount, currency)}</span>
                                    </div>
                                ) : null}
                            </div>
                            <div className="border-hairline-soft text-ink-muted flex justify-between border-t pt-2">
                                <span>Tax</span>
                                <span className="text-ink">{formatMoney(totals.tax, currency)}</span>
                            </div>
                            <div className="border-hairline text-ink flex justify-between border-t pt-3 text-base font-medium">
                                <span>Total</span>
                                <span>{formatMoney(totals.total, currency)}</span>
                            </div>
                        </div>

                        <Button type="submit" disabled={form.processing} className="bg-ink hover:bg-ink/90 mt-6 w-full text-white">
                            {form.processing ? 'Saving…' : editing ? 'Save invoice' : 'Create invoice'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.visit(route('invoices.index'))}
                            className="text-ink-muted mt-2 w-full"
                        >
                            Cancel
                        </Button>
                    </section>

                    <section className="border-hairline bg-canvas text-ink-muted rounded-xl border p-5 text-xs leading-relaxed">
                        <p className="text-ink font-medium">How totals work</p>
                        <p className="mt-2">
                            Each line is quantity × unit price. An invoice-level discount is spread proportionally so tax is charged on the discounted
                            amount.
                        </p>
                    </section>
                </aside>
            </div>
        </form>
    );
}
