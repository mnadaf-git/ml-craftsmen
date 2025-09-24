import { NavLink, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Beaker, 
  Database,
  Activity,
  ChevronRight,
  Sparkles
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

// Order updated: Projects first, EDA second, then Experiments, Observability
const navigationItems = [
  {
    title: "Projects",
    url: "/projects",
    icon: Database,
    description: "Project Management"
  },
  {
    title: "EDA",
    url: "/eda",
    icon: BarChart3,
    description: "Exploratory Data Analysis"
  },
  {
    title: "Experiments",
    url: "/experiments",
    icon: Beaker,
    description: "Model Training & Tracking"
  },
  {
    title: "Observability",
    url: "/observability",
    icon: Activity,
    description: "Model Monitoring"
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return `group relative transition-smooth ${
      active 
        ? "bg-primary/20 text-primary border-r-2 border-primary" 
        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
    }`;
  };

  return (
    <Sidebar className="border-r border-border bg-white/90 dark:bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-foreground">ML Platform</h2>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">Lifecycle Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 bg-transparent">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Core Features
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12 rounded-md">
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs opacity-70 truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      )}
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