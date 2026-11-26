import CustomerForm from '@/components/customer-form';
import PageHeader from '@/components/page-header';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Customers', href: '/customers' },
    { title: 'New customer', href: '/customers/create' },
];

export default function CreateCustomer() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New customer" />
            <div className="space-y-6">
                <PageHeader
                    eyebrow="Customers"
                    title="New customer"
                    description="Add a customer once, then invoice them, record payments, and keep a full billing history."
                />
                <CustomerForm action="create" />
            </div>
        </AppLayout>
    );
}
