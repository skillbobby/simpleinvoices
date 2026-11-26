import CustomerForm from '@/components/customer-form';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Customer } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';

interface EditCustomerProps {
    customer: Customer;
}

export default function EditCustomer({ customer }: EditCustomerProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Customers', href: '/customers' },
        { title: customer.name, href: route('customers.show', customer.id) },
        { title: 'Edit', href: route('customers.edit', customer.id) },
    ];

    const destroy = () => {
        if (!confirm(`Delete ${customer.name}? Customers with invoices are archived instead of deleted.`)) {
            return;
        }

        router.delete(route('customers.destroy', customer.id), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${customer.name}`} />
            <div className="space-y-6">
                <PageHeader
                    eyebrow={customer.company_name || 'Customer'}
                    title={`Edit ${customer.name}`}
                    description="Update contact details, billing address, and account status."
                    actions={
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-surface text-danger hover:bg-danger-soft hover:text-danger"
                            onClick={destroy}
                        >
                            <Trash2 /> Delete customer
                        </Button>
                    }
                />
                <CustomerForm customer={customer} action="edit" />
            </div>
        </AppLayout>
    );
}
