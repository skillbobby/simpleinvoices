import PageHeader from '@/components/page-header';
import ProductForm from '@/components/product-form';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TaxRate } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: '/products',
    },
    {
        title: 'New product',
        href: '/products/create',
    },
];

interface CreateProductProps {
    taxRates: TaxRate[];
}

export default function CreateProduct({ taxRates }: CreateProductProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New product" />

            <div className="space-y-6">
                <PageHeader eyebrow="Products" title="New product" description="Save an item or service once and reuse it across invoices." />

                <div className="mx-auto w-full max-w-3xl">
                    <ProductForm taxRates={taxRates} />
                </div>
            </div>
        </AppLayout>
    );
}
