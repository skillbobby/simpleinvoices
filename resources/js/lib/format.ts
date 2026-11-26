export function formatMoney(amount: number | string | null | undefined, currency = 'USD'): string {
    const value = Number(amount ?? 0);

    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${currency} ${value.toFixed(2)}`;
    }
}

export function formatDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value.length <= 10 ? `${value}T00:00:00Z` : value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days: number, from = todayISO()): string {
    const date = new Date(`${from}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);

    return date.toISOString().slice(0, 10);
}

export const invoiceStatusStyles: Record<string, string> = {
    draft: 'bg-surface-2 text-ink-muted border-hairline',
    sent: 'bg-[#eef4fb] text-[#1d4e89] border-[#cfe0f3]',
    partial: 'bg-warn-soft text-warn border-[#ecd9ab]',
    paid: 'bg-ok-soft text-ok border-[#bfe3ca]',
    overdue: 'bg-danger-soft text-danger border-[#f0c3bd]',
    void: 'bg-canvas text-ink-subtle border-hairline line-through',
};

export const invoiceStatusLabels: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    partial: 'Partially paid',
    paid: 'Paid',
    overdue: 'Overdue',
    void: 'Void',
};
