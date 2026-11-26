import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SearchFieldProps {
    value: string;
    placeholder?: string;
    onSearch: (value: string) => void;
}

export default function SearchField({ value, placeholder = 'Search…', onSearch }: SearchFieldProps) {
    const [query, setQuery] = useState(value);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(
        () => () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        },
        [],
    );

    return (
        <div className="relative w-full sm:w-72">
            <Search className="text-ink-subtle pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
                value={query}
                placeholder={placeholder}
                className="border-hairline bg-surface h-10 rounded-md pl-9 text-sm"
                onChange={(event) => {
                    const next = event.target.value;
                    setQuery(next);

                    if (timer.current) {
                        clearTimeout(timer.current);
                    }

                    timer.current = setTimeout(() => onSearch(next), 300);
                }}
            />
        </div>
    );
}
