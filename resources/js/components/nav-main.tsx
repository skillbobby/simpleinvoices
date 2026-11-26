import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [], label = 'Workspace' }: { items: NavItem[]; label?: string }) {
    const page = usePage();
    const current = page.url.split('?')[0];

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-ink-subtle text-[11px] tracking-wide uppercase">{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isActive = current === item.url || (item.url !== '/dashboard' && current.startsWith(item.url));

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className="data-[active=true]:bg-surface data-[active=true]:text-ink data-[active=true]:border-hairline text-ink-muted hover:bg-surface-2 rounded-md text-[13px] data-[active=true]:border data-[active=true]:shadow-none"
                            >
                                <Link href={item.url} prefetch>
                                    {item.icon && <item.icon className="size-4" />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
