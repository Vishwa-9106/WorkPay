import {
  LayoutDashboard,
  Users,
  Factory,
  Receipt,
  FileBarChart,
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { open } = useSidebar();
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
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-accent hover:text-accent-foreground";

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <div className="flex items-center p-4 border-b border-sidebar-border">
        <div className="bg-gradient-primary rounded-lg p-2 mr-3">
          <Factory className="h-6 w-6 text-primary-foreground" />
        </div>
        {open && (
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">{t('app.name')}</h1>
            <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            {open && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={getNavClass}
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}