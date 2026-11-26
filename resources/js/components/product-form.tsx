import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type TaxRate } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export interface ProductFormProduct {
    id: number;
    name: string;
    sku?: string | null;
    description?: string | null;
    unit_price: string | number;
    unit: string;
    tax_rate_id: number | null;
    is_active: boolean;
}

interface ProductFormProps {
    taxRates: TaxRate[];
    product?: ProductFormProduct;
}

const controlClass = 'h-10 rounded-md border-hairline bg-surface text-sm';

function formatRate(rate: number): string {
    return Number(rate.toFixed(2)).toString();
}

export default function ProductForm({ taxRates, product }: ProductFormProps) {
    const form = useForm({
        name: product?.name ?? '',
        sku: product?.sku ?? '',
        description: product?.description ?? '',
        unit_price: product ? String(product.unit_price) : '',
        unit: product?.unit ?? 'unit',
        tax_rate_id: (product?.tax_rate_id ?? null) as number | null,
        is_active: product?.is_active ?? true,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (product) {
            form.put(route('products.update', product.id));
        } else {
            form.post(route('products.store'));
        }
    };

    return (
        <form onSubmit={submit} className="border-hairline bg-surface rounded-xl border">
            <div className="space-y-8 p-5 md:p-6">
                <section className="space-y-5">
                    <div className="space-y-1">
                        <h2 className="text-ink text-base font-medium">Product details</h2>
                        <p className="text-ink-muted text-sm">Name and describe the item or service you invoice for.</p>
                    </div>

                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                placeholder="Design retainer"
                                autoComplete="off"
                                required
                                className={controlClass}
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="sku">SKU</Label>
                                <Input
                                    id="sku"
                                    value={form.data.sku}
                                    onChange={(event) => form.setData('sku', event.target.value)}
                                    placeholder="SKU-001"
                                    autoComplete="off"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.sku} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Input
                                    id="unit"
                                    value={form.data.unit}
                                    onChange={(event) => form.setData('unit', event.target.value)}
                                    placeholder="hour"
                                    autoComplete="off"
                                    className={controlClass}
                                />
                                <InputError message={form.errors.unit} />
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="unit_price">Unit price</Label>
                                <Input
                                    id="unit_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.data.unit_price}
                                    onChange={(event) => form.setData('unit_price', event.target.value)}
                                    placeholder="0.00"
                                    required
                                    className={controlClass}
                                />
                                <InputError message={form.errors.unit_price} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tax_rate_id">Tax rate</Label>
                                <select
                                    id="tax_rate_id"
                                    value={form.data.tax_rate_id === null ? '' : String(form.data.tax_rate_id)}
                                    onChange={(event) => form.setData('tax_rate_id', event.target.value === '' ? null : Number(event.target.value))}
                                    className="border-hairline bg-surface text-ink focus:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:ring-2 focus:outline-hidden"
                                >
                                    <option value="">No tax</option>
                                    {taxRates.map((taxRate) => (
                                        <option key={taxRate.id} value={taxRate.id}>
                                            {taxRate.name} · {formatRate(taxRate.rate)}%
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.tax_rate_id} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                                rows={4}
                                placeholder="Optional invoice description"
                                className="border-hairline bg-surface text-ink placeholder:text-ink-subtle focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
                            />
                            <InputError message={form.errors.description} />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="is_active"
                                className="border-hairline bg-canvas/40 flex cursor-pointer items-start gap-3 rounded-lg border p-4"
                            >
                                <Checkbox
                                    id="is_active"
                                    checked={form.data.is_active}
                                    onCheckedChange={(checked) => form.setData('is_active', checked === true)}
                                    className="mt-0.5"
                                />
                                <span className="space-y-0.5">
                                    <span className="text-ink block text-sm font-medium">Active product</span>
                                    <span className="text-ink-muted block text-xs">
                                        Inactive products stay on existing invoices but cannot be added to new ones.
                                    </span>
                                </span>
                            </label>
                            <InputError message={form.errors.is_active} />
                        </div>
                    </div>
                </section>
            </div>

            <div className="border-hairline flex flex-wrap items-center justify-end gap-3 border-t px-5 py-4 md:px-6">
                <Button type="button" variant="outline" asChild>
                    <Link href={route('products.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {product ? 'Save changes' : 'Create product'}
                </Button>
            </div>
        </form>
    );
}
