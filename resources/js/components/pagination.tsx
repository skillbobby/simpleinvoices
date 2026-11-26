import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number | null;
    to: number | null;
    total: number;
}

export default function Pagination({ links, from, to, total }: PaginationProps) {
    if (total === 0) {
        return null;
    }

    const previous = links[0];
    const next = links[links.length - 1];

    return (
        <div className="border-hairline flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
            <p className="text-ink-muted text-xs">
                Showing {from ?? 0}–{to ?? 0} of {total}
            </p>
            <div className="flex items-center gap-1">
                <Link
                    href={previous?.url ?? '#'}
                    preserveScroll
                    className={`border-hairline inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs ${previous?.url ? 'bg-surface text-ink hover:bg-surface-2' : 'text-ink-subtle pointer-events-none opacity-60'}`}
                >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Link>
                {links.slice(1, -1).map((link, index) =>
                    link.label === '...' ? (
                        <span key={`gap-${index}`} className="text-ink-subtle px-1 text-xs">
                            …
                        </span>
                    ) : (
                        <Link
                            key={link.label}
                            href={link.url ?? '#'}
                            preserveScroll
                            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs ${link.active ? 'border-ink bg-ink text-white' : 'border-hairline bg-surface text-ink hover:bg-surface-2'}`}
                        >
                            {link.label}
                        </Link>
                    ),
                )}
                <Link
                    href={next?.url ?? '#'}
                    preserveScroll
                    className={`border-hairline inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs ${next?.url ? 'bg-surface text-ink hover:bg-surface-2' : 'text-ink-subtle pointer-events-none opacity-60'}`}
                >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        </div>
    );
}
