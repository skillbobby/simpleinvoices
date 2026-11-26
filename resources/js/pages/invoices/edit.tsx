import InvoiceForm, { type InvoiceFormProps } from '@/components/invoice-form';
import PageHeader from '@/components/page-header';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Invoices', href: '/invoices' },
    { title: 'Edit invoice', href: '#' },
];

export default function EditInvoice(props: InvoiceFormProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${props.invoice?.number ?? 'invoice'}`} />
            <div className="space-y-8">
                <PageHeader
                    eyebrow="Edit invoice"
                    title={props.invoice?.number ?? 'Invoice'}
                    description="Changing items recalculates totals and the outstanding balance from the payment ledger."
                />
                <InvoiceForm {...props} />
            </div>
        </AppLayout>
    );
}
