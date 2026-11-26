import { invoiceStatusLabels, invoiceStatusStyles } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function InvoiceStatusBadge({ status, className }: { status: string; className?: string }) {
    const style = invoiceStatusStyles[status] ?? invoiceStatusStyles.draft;

    return (
        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide', style, className)}>
            {invoiceStatusLabels[status] ?? status}
        </span>
    );
}
