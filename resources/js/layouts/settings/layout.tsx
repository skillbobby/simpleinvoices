import PageHeader from '@/components/page-header';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Building2, CalendarClock, KeyRound, Palette, Percent, UserRound, Users, type LucideIcon } from 'lucide-react';

interface SettingsNavItem {
    title: string;
    href: string;
    icon: LucideIcon;
}

const accountNavItems: SettingsNavItem[] = [
    { title: 'Profile', href: '/settings/profile', icon: UserRound },
    { title: 'Password', href: '/settings/password', icon: KeyRound },
    { title: 'Appearance', href: '/settings/appearance', icon: Palette },
];

function SettingsNavLink({ item, active }: { item: SettingsNavItem; active: boolean }) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            prefetch
            aria-current={active ? 'page' : undefined}
            className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-ink text-white' : 'text-ink-muted hover:bg-canvas hover:text-ink',
            )}
        >
            <Icon className={cn('h-4 w-4', active ? 'text-white' : 'text-ink-subtle')} />
            <span className="whitespace-nowrap">{item.title}</span>
        </Link>
    );
}

function NavGroupLabel({ children }: { children: string }) {
    return <p className="text-ink-subtle hidden px-3 pt-2 pb-1 text-[11px] font-medium tracking-[0.08em] uppercase lg:block">{children}</p>;
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const page = usePage<SharedData>();
    const canManageSettings = page.props.auth.user?.can_manage_settings ?? false;

    const currentPath = (page.url.split('?')[0] || '/').replace(/\/+$/, '') || '/';
    const isActive = (href: string) => currentPath === href || currentPath.startsWith(`${href}/`);

    const companyNavItems: SettingsNavItem[] = [
        { title: 'Company', href: '/settings/company', icon: Building2 },
        { title: 'Tax rates', href: '/settings/tax-rates', icon: Percent },
        { title: 'Payment terms', href: '/settings/payment-terms', icon: CalendarClock },
        ...(canManageSettings ? [{ title: 'Team', href: '/settings/team', icon: Users }] : []),
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                description="Manage your company profile, invoice defaults, tax rates and the people who can access this workspace."
            />

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
                <aside className="lg:w-56 lg:shrink-0">
                    <nav
                        aria-label="Settings"
                        className="border-hairline bg-surface flex gap-1 overflow-x-auto rounded-xl border p-2 lg:sticky lg:top-20 lg:flex-col lg:overflow-visible"
                    >
                        {canManageSettings ? (
                            <>
                                <NavGroupLabel>Company</NavGroupLabel>
                                {companyNavItems.map((item) => (
                                    <SettingsNavLink key={item.href} item={item} active={isActive(item.href)} />
                                ))}
                                <div className="bg-hairline mx-1 my-2 hidden h-px shrink-0 lg:block" />
                            </>
                        ) : null}

                        <NavGroupLabel>Account</NavGroupLabel>
                        {accountNavItems.map((item) => (
                            <SettingsNavLink key={item.href} item={item} active={isActive(item.href)} />
                        ))}
                    </nav>
                </aside>

                <div className="min-w-0 flex-1 space-y-6">{children}</div>
            </div>
        </div>
    );
}
