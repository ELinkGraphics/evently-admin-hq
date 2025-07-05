import { Home, Calendar, Users, CreditCard, BarChart3, Settings, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    description: "Overview & Analytics"
  },
  {
    title: "Events",
    url: "/events",
    icon: Calendar,
    description: "Manage Events"
  },
  {
    title: "Attendees",
    url: "/attendees",
    icon: Users,
    description: "Participant Management"
  },
  {
    title: "Finance",
    url: "/finance",
    icon: CreditCard,
    description: "Financial Overview"
  },
  {
    title: "Payments",
    url: "/payments",
    icon: BarChart3,
    description: "Payment Processing"
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold text-sidebar-foreground">EventPro</h2>
            <p className="text-xs text-sidebar-foreground/70">Admin Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "h-12 px-3 group transition-all duration-200",
                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      )}
                    >
                      <Link to={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className={cn(
                          "w-5 h-5 transition-colors",
                          isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"
                        )} />
                        <div className="flex-1 group-data-[collapsible=icon]:hidden">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-sidebar-foreground/50">{item.description}</div>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-sidebar-primary group-data-[collapsible=icon]:hidden" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarRail />
    </Sidebar>
  );
}