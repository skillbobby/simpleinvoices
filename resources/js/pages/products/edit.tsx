import PageHeader from '@/components/page-header';
import ProductForm, { type ProductFormProduct } from '@/components/product-form';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TaxRate } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: '/products',
    },
    {
        title: 'Edit product',
        href: '/products',
    },
];

interface EditProductProps {
    product: ProductFormProduct;
    taxRates: TaxRate[];
}

export default function EditProduct({ product, taxRates }: EditProductProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${product.name}`} />

            <div className="space-y-6">
                <PageHeader eyebrow="Products" title={product.name} description="Update pricing, tax treatment, or availability for this product." />

                <div className="mx-auto w-full max-w-3xl">
                    <ProductForm taxRates={taxRates} product={product} />
                </div>
            </div>
        </AppLayout>
    );
}
