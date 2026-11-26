import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const { tenant } = usePage<SharedData>().props;

    return (
        <>
            <div className="bg-ink flex aspect-square size-8 items-center justify-center rounded-md text-white">
                <AppLogoIcon className="size-4 fill-current text-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="text-ink truncate text-[13px] leading-tight font-medium">Simple Invoices</span>
                <span className="text-ink-subtle truncate text-[11px] leading-tight">{tenant?.name ?? 'Workspace'}</span>
            </div>
        </>
    );
}
