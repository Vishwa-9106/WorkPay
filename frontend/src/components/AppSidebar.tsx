import {
  LayoutDashboard,
  Users,
  Factory,
  Receipt,
  FileBarChart,
  Package,
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
    {
      title: t('nav.dashboard'),
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: t('nav.workers'),
      url: "/workers",
      icon: Users,
    },
    {
      title: t('nav.production'),
      url: "/production",
      icon: Factory,
    },
    {
      title: t('nav.companyProduct'),
      url: "/products",
      icon: Package,
    },
    {
      title: t('nav.expenses'),
      url: "/expenses",
      icon: Receipt,
    },
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