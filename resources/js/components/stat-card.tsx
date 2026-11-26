import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatCardProps {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    accent?: boolean;
    className?: string;
}

export default function StatCard({ label, value, hint, accent = false, className }: StatCardProps) {
    return (
        <div className={cn('border-hairline bg-surface rounded-xl border p-5', accent && 'bg-ink border-transparent text-white', className)}>
            <p className={cn('text-[13px] font-medium', accent ? 'text-white/60' : 'text-ink-subtle')}>{label}</p>
            <p className={cn('mt-3 text-2xl font-medium tracking-tight', accent ? 'text-white' : 'text-ink')}>{value}</p>
            {hint ? <p className={cn('mt-2 text-xs', accent ? 'text-white/60' : 'text-ink-muted')}>{hint}</p> : null}
        </div>
    );
}
