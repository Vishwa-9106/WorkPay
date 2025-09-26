import {
  LayoutDashboard,
  Users,
  Factory,
  Receipt,
  FileBarChart,
  Package,
  Wallet,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const currentPath = location.pathname;

  const menuItems = [
    // 1. Dashboard
    {
      title: t('nav.dashboard'),
      url: "/",
      icon: LayoutDashboard,
    },
    // 2. Daily production
    {
      title: t('nav.production'),
      url: "/production",
      icon: Factory,
    },
    // Salary
    {
      title: t('nav.salary'),
      url: "/salary",
      icon: Wallet,
    },
    // 3. Company product
    {
      title: t('nav.companyProduct'),
      url: "/products",
      icon: Package,
    },
    // 4. Workers
    {
      title: t('nav.workers'),
      url: "/workers",
      icon: Users,
    },
    // 4.1 Salary Bonus (after Workers)
    {
      title: 'Weekly salary',
      url: '/salary-bonus',
      icon: Wallet,
    },
    // 5. Expenses
    {
      title: t('nav.expenses'),
      url: "/expenses",
      icon: Receipt,
    },
    // 6. Reports
    {
      title: t('nav.reports'),
      url: "/reports",
      icon: FileBarChart,
    },
  ];

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className="w-60" collapsible="none">
      <div className="flex items-center p-4 border-b border-sidebar-border">
        <div className="bg-gradient-primary rounded-lg p-2 mr-3">
          <Factory className="h-6 w-6 text-primary-foreground" />
        </div>
        {(
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">{t('app.name')}</h1>
            <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <NavLink
                    to={item.url}
                    end={item.url === "/"}
                    className={({ isActive }) => `
                      flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none
                      transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring
                      ${isActive 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "text-sidebar-foreground"
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="block">{item.title}</span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}