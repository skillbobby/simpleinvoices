import EmptyState from '@/components/empty-state';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type TaxRate } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Percent, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/company' },
    { title: 'Tax rates', href: '/settings/tax-rates' },
];

interface TaxRatesProps {
    taxRates: TaxRate[];
}

type TaxRateFormData = {
    name: string;
    rate: string;
    is_default: boolean;
    is_active: boolean;
};

const cardClass = 'rounded-xl border border-hairline bg-surface p-6';
const controlClass = 'border-hairline bg-surface text-sm';

function formatRate(rate: number): string {
    return Number(rate.toFixed(2)).toString();
}

function TaxRateForm({ rate, onDone }: { rate: TaxRate | null; onDone: () => void }) {
    const form = useForm<TaxRateFormData>({
        name: rate?.name ?? '',
        rate: rate ? formatRate(rate.rate) : '',
        is_default: rate?.is_default ?? false,
        is_active: rate?.is_active ?? true,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (rate) {
            form.patch(route('settings.tax-rates.update', rate.id), { preserveScroll: true, onSuccess: () => onDone() });
        } else {
            form.post(route('settings.tax-rates.store'), { preserveScroll: true, onSuccess: () => form.reset() });
        }
    };

    const destroy = () => {
        if (!rate) {
            return;
        }

        if (window.confirm(`Delete “${rate.name}”? Tax rates already used on invoices are deactivated instead.`)) {
            router.delete(route('settings.tax-rates.destroy', rate.id), { preserveScroll: true, onSuccess: () => onDone() });
        }
    };

    return (
        <section className={cn(cardClass, 'space-y-5')}>
            <div className="border-hairline flex items-start justify-between gap-3 border-b pb-4">
                <div className="space-y-1">
                    <h2 className="text-ink text-base font-medium">{rate ? 'Edit tax rate' : 'Add tax rate'}</h2>
                    <p className="text-ink-muted text-sm">
                        {rate ? 'Update this rate or remove it from the list.' : 'New rates are available on invoice line items right away.'}
                    </p>
                </div>
                {rate ? (
                    <Button type="button" variant="ghost" size="sm" onClick={onDone} className="text-ink-muted h-8 shrink-0 px-2">
                        Cancel
                    </Button>
                ) : null}
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            placeholder="Standard VAT"
                            autoComplete="off"
                            required
                            className={controlClass}
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="rate">Rate</Label>
                        <div className="relative">
                            <Input
                                id="rate"
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                value={form.data.rate}
                                onChange={(event) => form.setData('rate', event.target.value)}
                                placeholder="20"
                                required
                                className={cn(controlClass, 'pr-9')}
                            />
                            <span className="text-ink-subtle pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">%</span>
                        </div>
                        <InputError message={form.errors.rate} />
                    </div>

                    <label htmlFor="is_default" className="border-hairline bg-canvas/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                        <Checkbox
                            id="is_default"
                            checked={form.data.is_default}
                            onCheckedChange={(checked) => form.setData('is_default', checked === true)}
                            className="mt-0.5"
                        />
                        <span className="space-y-0.5">
                            <span className="text-ink block text-sm font-medium">Default rate</span>
                            <span className="text-ink-muted block text-xs">Pre-selected on new invoice line items.</span>
                        </span>
                    </label>

                    <label htmlFor="is_active" className="border-hairline bg-canvas/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                        <Checkbox
                            id="is_active"
                            checked={form.data.is_active}
                            onCheckedChange={(checked) => form.setData('is_active', checked === true)}
                            className="mt-0.5"
                        />
                        <span className="space-y-0.5">
                            <span className="text-ink block text-sm font-medium">Active</span>
                            <span className="text-ink-muted block text-xs">
                                Inactive rates stay on existing invoices but are hidden from selection.
                            </span>
                        </span>
                    </label>
                </div>

                <div className="border-hairline flex flex-wrap items-center gap-2 border-t pt-4">
                    {rate ? (
                        <Button type="button" variant="ghost" size="sm" onClick={destroy} className="text-ink-muted hover:text-danger h-8 px-2">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                    ) : null}
                    <Button type="submit" disabled={form.processing} className="ml-auto">
                        {rate ? 'Save changes' : 'Add tax rate'}
                    </Button>
                </div>
            </form>
        </section>
    );
}

export default function TaxRates({ taxRates }: TaxRatesProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selected = taxRates.find((rate) => rate.id === selectedId) ?? null;

    const toggleActive = (rate: TaxRate) => {
        router.patch(
            route('settings.tax-rates.update', rate.id),
            { name: rate.name, rate: rate.rate, is_default: rate.is_default, is_active: !rate.is_active },
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tax rates" />

            <SettingsLayout>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <section className={cn(cardClass, 'p-0')}>
                        <div className="border-hairline flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                            <div className="space-y-1">
                                <h2 className="text-ink text-base font-medium">Tax rates</h2>
                                <p className="text-ink-muted text-sm">Rates available when adding line items to an invoice.</p>
                            </div>
                            {selected ? (
                                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedId(null)}>
                                    <Plus /> New rate
                                </Button>
                            ) : null}
                        </div>

                        {taxRates.length === 0 ? (
                            <div className="p-5">
                                <EmptyState
                                    icon={<Percent className="h-6 w-6" />}
                                    title="No tax rates yet"
                                    description="Add your first tax rate with the form, then select it on invoice line items."
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-hairline text-ink-subtle border-b text-[11px] tracking-wide uppercase">
                                            <th className="px-5 py-3 text-left font-medium">Name</th>
                                            <th className="px-5 py-3 text-right font-medium">Rate %</th>
                                            <th className="px-5 py-3 text-left font-medium">Default</th>
                                            <th className="px-5 py-3 text-right font-medium">Products</th>
                                            <th className="px-5 py-3 text-left font-medium">Active</th>
                                            <th className="px-5 py-3 text-right font-medium">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {taxRates.map((rate) => (
                                            <tr
                                                key={rate.id}
                                                className={cn(
                                                    'border-hairline-soft border-b transition-colors last:border-0',
                                                    selectedId === rate.id ? 'bg-canvas' : 'hover:bg-canvas/50',
                                                )}
                                            >
                                                <td className="px-5 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedId(rate.id)}
                                                        className="text-ink text-left font-medium hover:underline"
                                                    >
                                                        {rate.name}
                                                    </button>
                                                </td>
                                                <td className="text-ink px-5 py-4 text-right tabular-nums">{formatRate(rate.rate)}%</td>
                                                <td className="px-5 py-4">
                                                    {rate.is_default ? (
                                                        <Badge variant="outline" className="bg-ink border-transparent text-[11px] text-white">
                                                            Default
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-ink-subtle text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="text-ink-muted px-5 py-4 text-right tabular-nums">{rate.products_count ?? 0}</td>
                                                <td className="px-5 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActive(rate)}
                                                        aria-pressed={rate.is_active}
                                                        title={rate.is_active ? 'Deactivate tax rate' : 'Activate tax rate'}
                                                        className={cn(
                                                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                                                            rate.is_active
                                                                ? 'bg-ok-soft text-ok border-transparent'
                                                                : 'border-hairline bg-surface-2 text-ink-muted',
                                                        )}
                                                    >
                                                        <span
                                                            className={cn('h-1.5 w-1.5 rounded-full', rate.is_active ? 'bg-ok' : 'bg-ink-subtle')}
                                                        />
                                                        {rate.is_active ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedId(rate.id)}
                                                            className="text-ink-muted h-8 px-2"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" /> Edit
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <div className="xl:sticky xl:top-20 xl:self-start">
                        <TaxRateForm key={selected?.id ?? 'new'} rate={selected} onDone={() => setSelectedId(null)} />
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
