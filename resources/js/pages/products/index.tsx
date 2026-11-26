import EmptyState from '@/components/empty-state';
import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import SearchField from '@/components/search-field';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatMoney } from '@/lib/format';
import { type BreadcrumbItem, type Paginated, type Product, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: '/products',
    },
];

interface ProductsIndexProps {
    products: Paginated<Product>;
    filters: {
        search: string;
        status: string;
    };
}

const statusLabels: Record<string, string> = {
    all: 'All products',
    active: 'Active',
    inactive: 'Inactive',
};

function formatRate(rate: number): string {
    return Number(rate.toFixed(2)).toString();
}

export default function ProductsIndex({ products, filters }: ProductsIndexProps) {
    const currency = usePage<SharedData>().props.tenant?.currency_code ?? 'USD';

    const applyFilters = (next: { search?: string; status?: string }) => {
        router.get(
            route('products.index'),
            {
                search: next.search ?? filters.search,
                status: next.status ?? filters.status,
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const destroy = (product: Product) => {
        if (window.confirm(`Delete “${product.name}”? This cannot be undone.`)) {
            router.delete(route('products.destroy', product.id), { preserveScroll: true });
        }
    };

    const hasFilters = filters.search !== '' || (filters.status !== '' && filters.status !== 'all');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <div className="space-y-6">
                <PageHeader
                    title="Products"
                    description="Reusable items and services with their default pricing and tax treatment."
                    actions={
                        <Button asChild>
                            <Link href={route('products.create')}>
                                <Plus /> New product
                            </Link>
                        </Button>
                    }
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SearchField value={filters.search} placeholder="Search products…" onSearch={(value) => applyFilters({ search: value })} />
                    <div className="flex items-center gap-2">
                        <label htmlFor="status-filter" className="text-ink-subtle text-xs font-medium">
                            Status
                        </label>
                        <select
                            id="status-filter"
                            value={filters.status === '' ? 'all' : filters.status}
                            onChange={(event) => applyFilters({ status: event.target.value })}
                            className="border-hairline bg-surface text-ink focus:ring-ring h-10 rounded-md border px-3 text-sm focus:ring-2 focus:outline-hidden"
                        >
                            {Object.entries(statusLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {products.data.length === 0 ? (
                    <EmptyState
                        icon={<Package className="h-6 w-6" />}
                        title={hasFilters ? 'No products match your filters' : 'No products yet'}
                        description={
                            hasFilters
                                ? 'Try a different search term or status, or clear the filters to see everything.'
                                : 'Add your first product to speed up invoicing with consistent pricing.'
                        }
                        action={
                            hasFilters ? (
                                <Button variant="outline" onClick={() => router.get(route('products.index'))}>
                                    Clear filters
                                </Button>
                            ) : (
                                <Button asChild>
                                    <Link href={route('products.create')}>
                                        <Plus /> New product
                                    </Link>
                                </Button>
                            )
                        }
                    />
                ) : (
                    <div className="border-hairline bg-surface overflow-hidden rounded-xl border">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead>
                                    <tr className="border-hairline bg-surface-2/60 text-ink-subtle border-b text-[11px] tracking-wide uppercase">
                                        <th className="px-5 py-3 font-medium">Name / SKU</th>
                                        <th className="px-5 py-3 text-right font-medium">Unit price</th>
                                        <th className="px-5 py-3 font-medium">Tax rate</th>
                                        <th className="px-5 py-3 font-medium">Unit</th>
                                        <th className="px-5 py-3 font-medium">Status</th>
                                        <th className="px-5 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-hairline-soft divide-y">
                                    {products.data.map((product) => (
                                        <tr key={product.id} className="hover:bg-canvas/40 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="text-ink font-medium">{product.name}</p>
                                                <p className="text-ink-subtle mt-0.5 text-xs">{product.sku ? product.sku : 'No SKU'}</p>
                                            </td>
                                            <td className="text-ink px-5 py-4 text-right tabular-nums">
                                                {formatMoney(product.unit_price, currency)}
                                            </td>
                                            <td className="px-5 py-4">
                                                {product.tax_rate ? (
                                                    <span className="border-hairline text-ink-muted inline-flex items-center rounded-md border px-2 py-0.5 text-xs">
                                                        {product.tax_rate.name} · {formatRate(product.tax_rate.rate)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-ink-subtle text-xs">No tax</span>
                                                )}
                                            </td>
                                            <td className="text-ink-muted px-5 py-4 capitalize">{product.unit || '—'}</td>
                                            <td className="px-5 py-4">
                                                <span className="border-hairline text-ink-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
                                                    <span className={`h-1.5 w-1.5 rounded-full ${product.is_active ? 'bg-fin' : 'bg-ink-subtle'}`} />
                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="sm" asChild className="text-ink-muted h-8 px-2">
                                                        <Link href={route('products.edit', product.id)}>
                                                            <Pencil className="h-3.5 w-3.5" /> Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => destroy(product)}
                                                        className="text-ink-muted hover:text-danger h-8 px-2"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 pb-5">
                            <Pagination links={products.links} from={products.from} to={products.to} total={products.total} />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
