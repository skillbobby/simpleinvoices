import InvoiceForm, { type InvoiceFormProps } from '@/components/invoice-form';
import PageHeader from '@/components/page-header';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Invoices', href: '/invoices' },
    { title: 'New invoice', href: '/invoices/create' },
];

export default function CreateInvoice(props: InvoiceFormProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New invoice" />
            <div className="space-y-8">
                <PageHeader
                    eyebrow="New invoice"
                    title="Build an invoice"
                    description="Pick a customer, add line items and tax. The number is reserved when you save."
                />
                <InvoiceForm {...props} />
            </div>
        </AppLayout>
    );
}
