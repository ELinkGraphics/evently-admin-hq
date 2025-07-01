
import { Calendar, Users, CreditCard, BarChart3, Settings, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const navigation = [
  { name: "Dashboard", icon: Home, href: "/", requiredRole: 'viewer' as const },
  { name: "Events", icon: Calendar, href: "/events", requiredRole: 'moderator' as const },
  { name: "Attendees", icon: Users, href: "/attendees", requiredRole: 'viewer' as const },
  { name: "Finance", icon: CreditCard, href: "/finance", requiredRole: 'moderator' as const },
];

export const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const location = useLocation();
  const { hasRole } = useAuth();

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => hasRole(item.requiredRole));

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white/80 backdrop-blur-xl border-r border-border transition-all duration-300",
        open ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-4 border-b border-border">
          <div className={cn("flex items-center", open ? "space-x-3" : "justify-center")}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            {open && (
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EventPro
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                location.pathname === item.href
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                !open && "justify-center"
              )}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 w-5 h-5",
                  location.pathname === item.href ? "text-blue-600" : "text-muted-foreground group-hover:text-accent-foreground",
                  open ? "mr-3" : ""
                )}
              />
              {open && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};
