import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="bg-canvas flex min-h-svh flex-col lg:flex-row">
            <aside className="border-hairline bg-ink relative hidden flex-1 flex-col justify-between border-r p-12 text-white lg:flex">
                <Link href={route('home')} className="flex items-center gap-3">
                    <span className="text-ink flex h-9 w-9 items-center justify-center rounded-md bg-white">
                        <AppLogoIcon className="size-4 fill-current" />
                    </span>
                    <span className="text-sm font-medium tracking-tight">Simple Invoices</span>
                </Link>

                <div className="max-w-md space-y-6">
                    <p className="text-[11px] tracking-[0.1em] text-white/50 uppercase">Multi-company billing</p>
                    <h2 className="text-display text-[40px] leading-[1.05] text-white">Invoicing that stays calm, even at month end.</h2>
                    <p className="text-sm leading-relaxed text-white/70">
                        Every company gets its own isolated workspace: customers, products, numbered invoices, payment tracking and reports. No
                        spreadsheets, no cross-tenant surprises.
                    </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="bg-fin h-2 w-2 rounded-full" />
                    Built on Laravel · styled for calm
                </div>
            </aside>

            <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-start gap-4">
                            <Link href={route('home')} className="text-ink flex items-center gap-2 text-sm font-medium lg:hidden">
                                <span className="bg-ink flex h-8 w-8 items-center justify-center rounded-md text-white">
                                    <AppLogoIcon className="size-4 fill-current text-white" />
                                </span>
                                Simple Invoices
                            </Link>

                            <div className="space-y-2">
                                <h1 className="text-display text-ink text-3xl">{title}</h1>
                                <p className="text-ink-muted text-sm">{description}</p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
