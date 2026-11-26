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
import { type BreadcrumbItem, type PaymentTerm } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/company' },
    { title: 'Payment terms', href: '/settings/payment-terms' },
];

interface PaymentTermsProps {
    paymentTerms: PaymentTerm[];
}

type PaymentTermFormData = {
    name: string;
    days: string;
    is_default: boolean;
};

const cardClass = 'rounded-xl border border-hairline bg-surface p-6';
const controlClass = 'border-hairline bg-surface text-sm';
const hintClass = 'text-ink-subtle text-xs';

function describeDays(days: number): string {
    if (days === 0) {
        return 'Due on receipt';
    }

    return days === 1 ? '1 day' : `${days} days`;
}

function PaymentTermForm({ term, onDone }: { term: PaymentTerm | null; onDone: () => void }) {
    const form = useForm<PaymentTermFormData>({
        name: term?.name ?? '',
        days: term ? String(term.days) : '14',
        is_default: term?.is_default ?? false,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (term) {
            form.patch(route('settings.payment-terms.update', term.id), { preserveScroll: true, onSuccess: () => onDone() });
        } else {
            form.post(route('settings.payment-terms.store'), { preserveScroll: true, onSuccess: () => form.reset() });
        }
    };

    const destroy = () => {
        if (!term) {
            return;
        }

        if (window.confirm(`Delete “${term.name}”? Invoices already using this term keep their due dates.`)) {
            router.delete(route('settings.payment-terms.destroy', term.id), { preserveScroll: true, onSuccess: () => onDone() });
        }
    };

    return (
        <section className={cn(cardClass, 'space-y-5')}>
            <div className="border-hairline flex items-start justify-between gap-3 border-b pb-4">
                <div className="space-y-1">
                    <h2 className="text-ink text-base font-medium">{term ? 'Edit payment term' : 'Add payment term'}</h2>
                    <p className="text-ink-muted text-sm">
                        {term ? 'Update this term or remove it from the list.' : 'Payment terms set the default due date for new invoices.'}
                    </p>
                </div>
                {term ? (
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
                            placeholder="Net 30"
                            autoComplete="off"
                            required
                            className={controlClass}
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="days">Days until due</Label>
                        <Input
                            id="days"
                            type="number"
                            min={0}
                            max={365}
                            value={form.data.days}
                            onChange={(event) => form.setData('days', event.target.value)}
                            required
                            className={controlClass}
                        />
                        <p className={hintClass}>Use 0 for invoices due on receipt.</p>
                        <InputError message={form.errors.days} />
                    </div>

                    <label htmlFor="is_default" className="border-hairline bg-canvas/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                        <Checkbox
                            id="is_default"
                            checked={form.data.is_default}
                            onCheckedChange={(checked) => form.setData('is_default', checked === true)}
                            className="mt-0.5"
                        />
                        <span className="space-y-0.5">
                            <span className="text-ink block text-sm font-medium">Default term</span>
                            <span className="text-ink-muted block text-xs">Pre-selected when creating a new invoice.</span>
                        </span>
                    </label>
                </div>

                <div className="border-hairline flex flex-wrap items-center gap-2 border-t pt-4">
                    {term ? (
                        <Button type="button" variant="ghost" size="sm" onClick={destroy} className="text-ink-muted hover:text-danger h-8 px-2">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                    ) : null}
                    <Button type="submit" disabled={form.processing} className="ml-auto">
                        {term ? 'Save changes' : 'Add payment term'}
                    </Button>
                </div>
            </form>
        </section>
    );
}

export default function PaymentTerms({ paymentTerms }: PaymentTermsProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selected = paymentTerms.find((term) => term.id === selectedId) ?? null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment terms" />

            <SettingsLayout>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <section className={cn(cardClass, 'p-0')}>
                        <div className="border-hairline flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                            <div className="space-y-1">
                                <h2 className="text-ink text-base font-medium">Payment terms</h2>
                                <p className="text-ink-muted text-sm">Due date presets used when creating invoices.</p>
                            </div>
                            {selected ? (
                                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedId(null)}>
                                    <Plus /> New term
                                </Button>
                            ) : null}
                        </div>

                        {paymentTerms.length === 0 ? (
                            <div className="p-5">
                                <EmptyState
                                    icon={<CalendarClock className="h-6 w-6" />}
                                    title="No payment terms yet"
                                    description="Add a term such as Net 30 with the form to set a default due date."
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-hairline text-ink-subtle border-b text-[11px] tracking-wide uppercase">
                                            <th className="px-5 py-3 text-left font-medium">Name</th>
                                            <th className="px-5 py-3 text-left font-medium">Days</th>
                                            <th className="px-5 py-3 text-left font-medium">Default</th>
                                            <th className="px-5 py-3 text-right font-medium">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentTerms.map((term) => (
                                            <tr
                                                key={term.id}
                                                className={cn(
                                                    'border-hairline-soft border-b transition-colors last:border-0',
                                                    selectedId === term.id ? 'bg-canvas' : 'hover:bg-canvas/50',
                                                )}
                                            >
                                                <td className="px-5 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedId(term.id)}
                                                        className="text-ink text-left font-medium hover:underline"
                                                    >
                                                        {term.name}
                                                    </button>
                                                </td>
                                                <td className="text-ink-muted px-5 py-4 tabular-nums">{describeDays(term.days)}</td>
                                                <td className="px-5 py-4">
                                                    {term.is_default ? (
                                                        <Badge variant="outline" className="bg-ink border-transparent text-[11px] text-white">
                                                            Default
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-ink-subtle text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedId(term.id)}
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
                        <PaymentTermForm key={selected?.id ?? 'new'} term={selected} onDone={() => setSelectedId(null)} />
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
