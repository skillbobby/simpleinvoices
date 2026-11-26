import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FlashMessages() {
    const { flash } = usePage<SharedData>().props;
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 6000);

        return () => clearTimeout(timer);
    }, [flash?.success, flash?.error]);

    if (!visible || (!flash?.success && !flash?.error)) {
        return null;
    }

    return (
        <div className="no-print fixed right-4 bottom-4 z-50 flex flex-col gap-2">
            {flash.success ? (
                <div className="border-hairline bg-surface text-ink flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-sm">
                    <CheckCircle2 className="text-ok mt-0.5 h-4 w-4" />
                    <span>{flash.success}</span>
                </div>
            ) : null}
            {flash.error ? (
                <div className="bg-danger-soft text-danger flex items-start gap-2 rounded-lg border border-[#f0c3bd] px-4 py-3 text-sm">
                    <XCircle className="mt-0.5 h-4 w-4" />
                    <span>{flash.error}</span>
                </div>
            ) : null}
        </div>
    );
}
