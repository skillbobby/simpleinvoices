import { ReactNode } from 'react';

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
    return (
        <div className="border-hairline bg-surface/60 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
            {icon ? <div className="text-ink-subtle mb-4">{icon}</div> : null}
            <h3 className="text-ink text-lg font-medium">{title}</h3>
            {description ? <p className="text-ink-muted mt-2 max-w-md text-sm">{description}</p> : null}
            {action ? <div className="mt-6">{action}</div> : null}
        </div>
    );
}
