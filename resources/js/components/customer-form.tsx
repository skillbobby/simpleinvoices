import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type Customer } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { type FormEvent, type ReactNode } from 'react';

type CustomerFormData = {
    name: string;
    company_name: string;
    email: string;
    phone: string;
    mobile: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    tax_id: string;
    currency_code: string;
    notes: string;
    is_active: boolean;
};

interface CustomerFormProps {
    customer?: Customer;
    action: 'create' | 'edit';
}

const inputClassName = 'h-10 rounded-md border-hairline bg-surface text-ink placeholder:text-ink-subtle';

export default function CustomerForm({ customer, action }: CustomerFormProps) {
    const form = useForm<CustomerFormData>({
        name: customer?.name ?? '',
        company_name: customer?.company_name ?? '',
        email: customer?.email ?? '',
        phone: customer?.phone ?? '',
        mobile: customer?.mobile ?? '',
        address_line1: customer?.address_line1 ?? '',
        address_line2: customer?.address_line2 ?? '',
        city: customer?.city ?? '',
        state: customer?.state ?? '',
        postal_code: customer?.postal_code ?? '',
        country: customer?.country ?? '',
        tax_id: customer?.tax_id ?? '',
        currency_code: customer?.currency_code ?? '',
        notes: customer?.notes ?? '',
        is_active: customer?.is_active ?? true,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (action === 'edit' && customer) {
            form.patch(route('customers.update', customer.id));
        } else {
            form.post(route('customers.store'));
        }
    };

    const cancelHref = action === 'edit' && customer ? route('customers.show', customer.id) : route('customers.index');

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                <section className="border-hairline bg-surface space-y-5 rounded-xl border p-5 md:p-6">
                    <div>
                        <h2 className="text-ink text-lg font-medium">Customer details</h2>
                        <p className="text-ink-muted mt-1 text-sm">Contact information used on invoices, statements, and reminders.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Name" htmlFor="name" error={form.errors.name} className="sm:col-span-2">
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                placeholder="Jane Cooper"
                                autoFocus
                                required
                                className={inputClassName}
                            />
                        </Field>

                        <Field label="Company" htmlFor="company_name" error={form.errors.company_name}>
                            <Input
                                id="company_name"
                                value={form.data.company_name}
                                onChange={(event) => form.setData('company_name', event.target.value)}
                                placeholder="Acme Studio"
                                className={inputClassName}
                            />
                        </Field>

                        <Field label="Tax ID" htmlFor="tax_id" error={form.errors.tax_id}>
                            <Input
                                id="tax_id"
                                value={form.data.tax_id}
                                onChange={(event) => form.setData('tax_id', event.target.value)}
                                placeholder="VAT-123456"
                                className={inputClassName}
                            />
                        </Field>

                        <Field label="Email" htmlFor="email" error={form.errors.email}>
                            <Input
                                id="email"
                                type="email"
                                value={form.data.email}
                                onChange={(event) => form.setData('email', event.target.value)}
                                placeholder="jane@acme.com"
                                className={inputClassName}
                            />
                        </Field>

                        <Field label="Phone" htmlFor="phone" error={form.errors.phone}>
                            <Input
                                id="phone"
                                value={form.data.phone}
                                onChange={(event) => form.setData('phone', event.target.value)}
                                placeholder="+1 555 0100"
                                className={inputClassName}
                            />
                        </Field>

                        <Field label="Mobile" htmlFor="mobile" error={form.errors.mobile}>
                            <Input
                                id="mobile"
                                value={form.data.mobile}
                                onChange={(event) => form.setData('mobile', event.target.value)}
                                placeholder="+1 555 0199"
                                className={inputClassName}
                            />
                        </Field>

                        <Field
                            label="Currency"
                            htmlFor="currency_code"
                            error={form.errors.currency_code}
                            hint="Optional 3-letter code. Defaults to your company currency."
                        >
                            <Input
                                id="currency_code"
                                value={form.data.currency_code}
                                onChange={(event) => form.setData('currency_code', event.target.value.toUpperCase())}
                                placeholder="USD"
                                maxLength={3}
                                className={cn(inputClassName, 'uppercase')}
                            />
                        </Field>
                    </div>

                    <Field label="Notes" htmlFor="notes" error={form.errors.notes} hint="Internal notes only — never shown to the customer.">
                        <textarea
                            id="notes"
                            rows={4}
                            value={form.data.notes}
                            onChange={(event) => form.setData('notes', event.target.value)}
                            placeholder="Preferred contact hours, payment arrangements, or anything worth remembering."
                            className="border-hairline bg-surface text-ink placeholder:text-ink-subtle focus-visible:ring-ring flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-hidden"
                        />
                    </Field>
                </section>

                <div className="space-y-5">
                    <section className="border-hairline bg-surface space-y-5 rounded-xl border p-5 md:p-6">
                        <div>
                            <h2 className="text-ink text-lg font-medium">Billing address</h2>
                            <p className="text-ink-muted mt-1 text-sm">Shown on invoices as the customer&apos;s address.</p>
                        </div>

                        <Field label="Address line 1" htmlFor="address_line1" error={form.errors.address_line1}>
                            <Input
                                id="address_line1"
                                value={form.data.address_line1}
                                onChange={(event) => form.setData('address_line1', event.target.value)}
                                placeholder="123 Market Street"
                                className={inputClassName}
                            />
                        </Field>

                        <Field label="Address line 2" htmlFor="address_line2" error={form.errors.address_line2}>
                            <Input
                                id="address_line2"
                                value={form.data.address_line2}
                                onChange={(event) => form.setData('address_line2', event.target.value)}
                                placeholder="Suite 400"
                                className={inputClassName}
                            />
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="City" htmlFor="city" error={form.errors.city}>
                                <Input
                                    id="city"
                                    value={form.data.city}
                                    onChange={(event) => form.setData('city', event.target.value)}
                                    placeholder="San Francisco"
                                    className={inputClassName}
                                />
                            </Field>

                            <Field label="State / region" htmlFor="state" error={form.errors.state}>
                                <Input
                                    id="state"
                                    value={form.data.state}
                                    onChange={(event) => form.setData('state', event.target.value)}
                                    placeholder="CA"
                                    className={inputClassName}
                                />
                            </Field>

                            <Field label="Postal code" htmlFor="postal_code" error={form.errors.postal_code}>
                                <Input
                                    id="postal_code"
                                    value={form.data.postal_code}
                                    onChange={(event) => form.setData('postal_code', event.target.value)}
                                    placeholder="94103"
                                    className={inputClassName}
                                />
                            </Field>

                            <Field label="Country" htmlFor="country" error={form.errors.country}>
                                <Input
                                    id="country"
                                    value={form.data.country}
                                    onChange={(event) => form.setData('country', event.target.value)}
                                    placeholder="United States"
                                    className={inputClassName}
                                />
                            </Field>
                        </div>

                        <p className="border-hairline-soft bg-canvas/60 text-ink-muted rounded-lg border px-3 py-2 text-xs leading-relaxed">
                            Customers are private to your company. Other companies on Simple Invoices can never see or reuse these records.
                        </p>
                    </section>

                    <section className="border-hairline bg-surface rounded-xl border p-5 md:p-6">
                        <h2 className="text-ink text-lg font-medium">Account status</h2>

                        <label
                            htmlFor="is_active"
                            className="border-hairline-soft bg-canvas/40 mt-4 flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                        >
                            <input
                                id="is_active"
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) => form.setData('is_active', event.target.checked)}
                                className="border-hairline accent-ink focus:ring-ring mt-0.5 h-4 w-4 rounded"
                            />
                            <span>
                                <span className="text-ink block text-sm font-medium">Active customer</span>
                                <span className="text-ink-muted block text-xs leading-relaxed">
                                    Archived customers stay in your records but are hidden from invoice customer pickers.
                                </span>
                            </span>
                        </label>
                        <InputError message={form.errors.is_active} className="mt-2" />
                    </section>
                </div>
            </div>

            <div className="border-hairline flex flex-wrap items-center justify-end gap-2 border-t pt-5">
                <Button type="button" variant="outline" className="bg-surface" asChild>
                    <Link href={cancelHref}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing ? 'Saving…' : action === 'edit' ? 'Save changes' : 'Create customer'}
                </Button>
            </div>
        </form>
    );
}

function Field({
    label,
    htmlFor,
    error,
    hint,
    className,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    hint?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor={htmlFor} className="text-ink-muted text-xs font-medium">
                {label}
            </Label>
            {children}
            {hint ? <p className="text-ink-subtle text-xs leading-relaxed">{hint}</p> : null}
            <InputError message={error} />
        </div>
    );
}
