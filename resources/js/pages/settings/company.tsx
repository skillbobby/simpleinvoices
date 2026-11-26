import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type CompanyProfile } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { FormEventHandler, useRef } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/company' },
    { title: 'Company', href: '/settings/company' },
];

interface CompanySettingsProps {
    company: CompanyProfile;
    nextNumberPreview: string;
}

type CompanyFormData = {
    name: string;
    email: string;
    phone: string;
    website: string;
    tax_id: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    currency_code: string;
    locale: string;
    timezone: string;
    invoice_prefix: string;
    invoice_next_number: string;
    invoice_number_padding: string;
    default_payment_terms_days: string;
    default_tax_rate: string;
    invoice_notes: string;
    invoice_footer: string;
    bank_details: string;
    logo: File | null;
};

const cardClass = 'rounded-xl border border-hairline bg-surface p-6';
const controlClass = 'border-hairline bg-surface text-sm';
const textareaClass =
    'border-hairline bg-surface text-ink placeholder:text-ink-subtle focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden';
const hintClass = 'text-ink-subtle text-xs';

function formatRateValue(value: string | number): string {
    const numeric = Number(value);

    return Number.isFinite(numeric) ? String(numeric) : String(value);
}

function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <div className="border-hairline space-y-1 border-b pb-4">
            <h2 className="text-ink text-base font-medium">{title}</h2>
            <p className="text-ink-muted text-sm">{description}</p>
        </div>
    );
}

export default function CompanySettings({ company, nextNumberPreview }: CompanySettingsProps) {
    const fileInput = useRef<HTMLInputElement>(null);

    const form = useForm<CompanyFormData>({
        name: company.name,
        email: company.email ?? '',
        phone: company.phone ?? '',
        website: company.website ?? '',
        tax_id: company.tax_id ?? '',
        address_line1: company.address_line1 ?? '',
        address_line2: company.address_line2 ?? '',
        city: company.city ?? '',
        state: company.state ?? '',
        postal_code: company.postal_code ?? '',
        country: company.country ?? '',
        currency_code: company.currency_code,
        locale: company.locale,
        timezone: company.timezone,
        invoice_prefix: company.invoice_prefix,
        invoice_next_number: String(company.invoice_next_number),
        invoice_number_padding: String(company.invoice_number_padding),
        default_payment_terms_days: String(company.default_payment_terms_days),
        default_tax_rate: formatRateValue(company.default_tax_rate),
        invoice_notes: company.invoice_notes ?? '',
        invoice_footer: company.invoice_footer ?? '',
        bank_details: company.bank_details ?? '',
        logo: null,
    });

    const prefix = form.data.invoice_prefix.trim() || 'INV';
    const nextNumber = Math.max(1, Number.parseInt(form.data.invoice_next_number, 10) || 1);
    const padding = Math.min(10, Math.max(1, Number.parseInt(form.data.invoice_number_padding, 10) || 1));
    const preview = `${prefix}-${String(nextNumber).padStart(padding, '0')}`;

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        // A POST keeps the logo upload multipart; `_method` spoofs the PATCH route.
        form.transform((data) => ({ ...data, _method: 'patch' }));
        form.post(route('settings.company.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset('logo');

                if (fileInput.current) {
                    fileInput.current.value = '';
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company settings" />

            <SettingsLayout>
                <form onSubmit={submit} className="space-y-6">
                    <section className={cn(cardClass, 'space-y-5')}>
                        <SectionHeader title="Company profile" description="These details appear on invoices, PDF exports and customer emails." />

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="border-hairline bg-canvas flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                                {company.logo_path ? (
                                    <img src={`/storage/${company.logo_path}`} alt="Company logo" className="h-full w-full object-contain" />
                                ) : (
                                    <Building2 className="text-ink-subtle h-7 w-7" />
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="logo">Company logo</Label>
                                <Input
                                    ref={fileInput}
                                    id="logo"
                                    name="logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => form.setData('logo', event.target.files?.[0] ?? null)}
                                    className="border-hairline bg-surface file:bg-ink h-auto max-w-sm text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                                />
                                <p className={hintClass}>
                                    {form.data.logo ? `Selected: ${form.data.logo.name}` : 'PNG, JPG or SVG up to 2 MB. Square logos work best.'}
                                </p>
                                <InputError message={form.errors.logo} />
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="name">Company name</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    placeholder="Northwind Studio"
                                    autoComplete="organization"
                                    required
                                    className={controlClass}
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Billing email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) => form.setData('email', event.target.value)}
                                    placeholder="billing@company.com"
                                    autoComplete="email"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={form.data.phone}
                                    onChange={(event) => form.setData('phone', event.target.value)}
                                    placeholder="+1 555 0100"
                                    autoComplete="tel"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.phone} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    type="text"
                                    value={form.data.website}
                                    onChange={(event) => form.setData('website', event.target.value)}
                                    placeholder="https://company.com"
                                    autoComplete="url"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.website} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tax_id">Tax ID</Label>
                                <Input
                                    id="tax_id"
                                    value={form.data.tax_id}
                                    onChange={(event) => form.setData('tax_id', event.target.value)}
                                    placeholder="VAT / EIN / ABN"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.tax_id} />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="address_line1">Address line 1</Label>
                                <Input
                                    id="address_line1"
                                    value={form.data.address_line1}
                                    onChange={(event) => form.setData('address_line1', event.target.value)}
                                    placeholder="Street and number"
                                    autoComplete="address-line1"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.address_line1} />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="address_line2">Address line 2</Label>
                                <Input
                                    id="address_line2"
                                    value={form.data.address_line2}
                                    onChange={(event) => form.setData('address_line2', event.target.value)}
                                    placeholder="Suite, floor, building"
                                    autoComplete="address-line2"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.address_line2} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={form.data.city}
                                    onChange={(event) => form.setData('city', event.target.value)}
                                    placeholder="City"
                                    autoComplete="address-level2"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.city} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="state">State / region</Label>
                                <Input
                                    id="state"
                                    value={form.data.state}
                                    onChange={(event) => form.setData('state', event.target.value)}
                                    placeholder="State"
                                    autoComplete="address-level1"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.state} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="postal_code">Postal code</Label>
                                <Input
                                    id="postal_code"
                                    value={form.data.postal_code}
                                    onChange={(event) => form.setData('postal_code', event.target.value)}
                                    placeholder="ZIP / postcode"
                                    autoComplete="postal-code"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.postal_code} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={form.data.country}
                                    onChange={(event) => form.setData('country', event.target.value)}
                                    placeholder="Country"
                                    autoComplete="country-name"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.country} />
                            </div>
                        </div>
                    </section>

                    <section className={cn(cardClass, 'space-y-5')}>
                        <SectionHeader
                            title="Billing & currency"
                            description="Currency and regional formatting applied to new invoices and reports."
                        />

                        <div className="grid gap-5 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="currency_code">Currency code</Label>
                                <Input
                                    id="currency_code"
                                    value={form.data.currency_code}
                                    onChange={(event) => form.setData('currency_code', event.target.value.toUpperCase().slice(0, 3))}
                                    placeholder="USD"
                                    maxLength={3}
                                    required
                                    className={cn(controlClass, 'uppercase')}
                                />
                                <p className={hintClass}>ISO 4217, three letters.</p>
                                <InputError message={form.errors.currency_code} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="locale">Locale</Label>
                                <Input
                                    id="locale"
                                    value={form.data.locale}
                                    onChange={(event) => form.setData('locale', event.target.value)}
                                    placeholder="en-US"
                                    required
                                    className={controlClass}
                                />
                                <p className={hintClass}>Used for dates and number formatting.</p>
                                <InputError message={form.errors.locale} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <Input
                                    id="timezone"
                                    value={form.data.timezone}
                                    onChange={(event) => form.setData('timezone', event.target.value)}
                                    placeholder="Europe/Berlin"
                                    required
                                    className={controlClass}
                                />
                                <p className={hintClass}>IANA timezone identifier.</p>
                                <InputError message={form.errors.timezone} />
                            </div>
                        </div>
                    </section>

                    <section className={cn(cardClass, 'space-y-5')}>
                        <SectionHeader
                            title="Invoice numbering"
                            description="Control how invoice numbers are generated. Numbers are reserved when an invoice is saved."
                        />

                        <div className="grid gap-5 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="invoice_prefix">Prefix</Label>
                                <Input
                                    id="invoice_prefix"
                                    value={form.data.invoice_prefix}
                                    onChange={(event) => form.setData('invoice_prefix', event.target.value)}
                                    placeholder="INV"
                                    maxLength={20}
                                    required
                                    className={cn(controlClass, 'uppercase')}
                                />
                                <InputError message={form.errors.invoice_prefix} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="invoice_next_number">Next number</Label>
                                <Input
                                    id="invoice_next_number"
                                    type="number"
                                    min={1}
                                    max={999999999}
                                    value={form.data.invoice_next_number}
                                    onChange={(event) => form.setData('invoice_next_number', event.target.value)}
                                    required
                                    className={controlClass}
                                />
                                <InputError message={form.errors.invoice_next_number} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="invoice_number_padding">Padding</Label>
                                <Input
                                    id="invoice_number_padding"
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={form.data.invoice_number_padding}
                                    onChange={(event) => form.setData('invoice_number_padding', event.target.value)}
                                    required
                                    className={controlClass}
                                />
                                <p className={hintClass}>Number of digits, 1–10.</p>
                                <InputError message={form.errors.invoice_number_padding} />
                            </div>
                        </div>

                        <div className="border-hairline bg-canvas/60 flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-ink-subtle text-[11px] font-medium tracking-wide uppercase">Preview</p>
                                <p className="text-ink mt-1 text-xl font-medium tracking-tight tabular-nums">{preview}</p>
                            </div>
                            <p className={hintClass}>
                                {preview === nextNumberPreview
                                    ? 'Matches the saved numbering.'
                                    : `Currently saved: ${nextNumberPreview}. Save to apply.`}
                            </p>
                        </div>
                    </section>

                    <section className={cn(cardClass, 'space-y-5')}>
                        <SectionHeader title="Defaults" description="Pre-filled values for newly created invoices." />

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="default_payment_terms_days">Payment terms (days)</Label>
                                <Input
                                    id="default_payment_terms_days"
                                    type="number"
                                    min={0}
                                    max={365}
                                    value={form.data.default_payment_terms_days}
                                    onChange={(event) => form.setData('default_payment_terms_days', event.target.value)}
                                    required
                                    className={controlClass}
                                />
                                <p className={hintClass}>Days between issue date and due date.</p>
                                <InputError message={form.errors.default_payment_terms_days} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="default_tax_rate">Default tax rate (%)</Label>
                                <Input
                                    id="default_tax_rate"
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.01"
                                    value={form.data.default_tax_rate}
                                    onChange={(event) => form.setData('default_tax_rate', event.target.value)}
                                    required
                                    className={controlClass}
                                />
                                <p className={hintClass}>Applied to new line items unless overridden.</p>
                                <InputError message={form.errors.default_tax_rate} />
                            </div>
                        </div>
                    </section>

                    <section className={cn(cardClass, 'space-y-5')}>
                        <SectionHeader title="Invoice content" description="Reusable copy that appears on every invoice and PDF." />

                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="invoice_notes">Invoice notes</Label>
                                <textarea
                                    id="invoice_notes"
                                    rows={4}
                                    value={form.data.invoice_notes}
                                    onChange={(event) => form.setData('invoice_notes', event.target.value)}
                                    placeholder="Payment instructions, thank-you note, or terms."
                                    className={textareaClass}
                                />
                                <InputError message={form.errors.invoice_notes} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="invoice_footer">Invoice footer</Label>
                                <textarea
                                    id="invoice_footer"
                                    rows={3}
                                    value={form.data.invoice_footer}
                                    onChange={(event) => form.setData('invoice_footer', event.target.value)}
                                    placeholder="Registered address or legal disclaimer."
                                    className={textareaClass}
                                />
                                <InputError message={form.errors.invoice_footer} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="bank_details">Bank details</Label>
                                <textarea
                                    id="bank_details"
                                    rows={3}
                                    value={form.data.bank_details}
                                    onChange={(event) => form.setData('bank_details', event.target.value)}
                                    placeholder="Bank name, IBAN, BIC / SWIFT."
                                    className={textareaClass}
                                />
                                <InputError message={form.errors.bank_details} />
                            </div>
                        </div>
                    </section>

                    <div className="border-hairline bg-surface sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
                        <p className={hintClass}>Changes apply to future invoices and PDFs.</p>
                        <div className="flex items-center gap-3">
                            {form.recentlySuccessful ? <span className="text-ok text-xs font-medium">Saved</span> : null}
                            <Button type="submit" disabled={form.processing} className="bg-ink hover:bg-ink/90 text-white">
                                {form.processing ? 'Saving…' : 'Save changes'}
                            </Button>
                        </div>
                    </div>
                </form>
            </SettingsLayout>
        </AppLayout>
    );
}
