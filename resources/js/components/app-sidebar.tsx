import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3, CreditCard, FileText, LayoutGrid, Package, Settings, Users } from 'lucide-react';
import AppLogo from './app-logo';

const workspaceNav: NavItem[] = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
    { title: 'Invoices', url: '/invoices', icon: FileText },
    { title: 'Customers', url: '/customers', icon: Users },
    { title: 'Products', url: '/products', icon: Package },
    { title: 'Payments', url: '/payments', icon: CreditCard },
    { title: 'Reports', url: '/reports', icon: BarChart3 },
];

const footerNavItems: NavItem[] = [{ title: 'Source repository', url: 'https://github.com/skillbobby/simpleinvoices', icon: FileText }];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;

    const accountNav: NavItem[] = [
        ...(auth.user?.can_manage_settings ? [{ title: 'Company settings', url: '/settings/company', icon: Settings }] : []),
        { title: 'Your profile', url: '/settings/profile', icon: Users },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={workspaceNav} label="Workspace" />
                <NavMain items={accountNav} label="Account" />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
