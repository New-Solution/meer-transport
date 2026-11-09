import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    ClipboardList,
    FileText,
    IdCard,
    LayoutGrid,
    MapPin,
    Settings as SettingsIcon,
    Tag,
    Truck as TruckIcon,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { dashboard } from '@/routes';
import { index as contractsIndex } from '@/routes/contracts';
import { index as customersIndex } from '@/routes/customers';
import { index as destinationsIndex } from '@/routes/destinations';
import { index as driversIndex } from '@/routes/drivers';
import { index as pricingIndex } from '@/routes/pricing';
import { edit as editProfile } from '@/routes/profile';
import { index as reportsIndex } from '@/routes/reports';
import { index as transportOrdersIndex } from '@/routes/transport-orders';
import { index as trucksIndex } from '@/routes/trucks';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage();
    const companySlug = page.props.currentCompany?.slug;
    const dashboardUrl = companySlug ? dashboard(companySlug) : '/';
    const { can } = usePermissions();

    const rawNavItems: (NavItem | false)[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
        can('contracts:view') && {
            title: 'Contracts',
            href: companySlug
                ? contractsIndex({ current_company: companySlug })
                : '/',
            icon: FileText,
        },
        can('customers:view') && {
            title: 'Customers',
            href: companySlug
                ? customersIndex({ current_company: companySlug })
                : '/',
            icon: Users,
        },
        can('orders:view') && {
            title: 'Transport Orders',
            href: companySlug
                ? transportOrdersIndex({ current_company: companySlug })
                : '/',
            icon: ClipboardList,
        },
        can('trucks:view') && {
            title: 'Trucks',
            href: companySlug
                ? trucksIndex({ current_company: companySlug })
                : '/',
            icon: TruckIcon,
        },
        can('drivers:view') && {
            title: 'Drivers',
            href: companySlug
                ? driversIndex({ current_company: companySlug })
                : '/',
            icon: IdCard,
        },
        can('destinations:view') && {
            title: 'Destinations',
            href: companySlug
                ? destinationsIndex({ current_company: companySlug })
                : '/',
            icon: MapPin,
        },
        can('pricing:manage') && {
            title: 'Pricing',
            href: companySlug
                ? pricingIndex({ current_company: companySlug })
                : '/',
            icon: Tag,
        },
        can('reports:view') && {
            title: 'Reports',
            href: companySlug
                ? reportsIndex({ current_company: companySlug })
                : '/',
            icon: BarChart3,
        },
        {
            title: 'Settings',
            href: editProfile(),
            icon: SettingsIcon,
        },
    ];

    const mainNavItems: NavItem[] = rawNavItems.filter(
        (item): item is NavItem => Boolean(item),
    );

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>
        </Sidebar>
    );
}
