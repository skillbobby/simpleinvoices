import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    eyebrow?: string;
    actions?: ReactNode;
}

export default function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
    return (
        <div className="border-hairline flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
                {eyebrow ? <p className="text-ink-subtle text-[13px] font-medium">{eyebrow}</p> : null}
                <h1 className="text-display text-ink text-3xl md:text-[40px]">{title}</h1>
                {description ? <p className="text-ink-muted max-w-2xl text-sm leading-relaxed">{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
    );
}
