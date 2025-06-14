import { Calendar, Users, CreditCard, BarChart3, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const navigation = [
  { name: "Dashboard", icon: Home, href: "/", current: false },
  { name: "Events", icon: Calendar, href: "/events", current: false },
  { name: "Attendees", icon: Users, href: "/attendees", current: false },
  { name: "Finance", icon: CreditCard, href: "/finance", current: false },
  { name: "Analytics", icon: BarChart3, href: "/analytics", current: false },
  { name: "Settings", icon: Settings, href: "/settings", current: false },
];

// Get the current path to highlight the active navigation item.
const getCurrentPath = () => {
  if (typeof window === "undefined") return "/";
  return window.location.pathname;
};

export const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const currentPath = getCurrentPath();

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
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                currentPath === item.href
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                !open && "justify-center"
              )}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 w-5 h-5",
                  currentPath === item.href ? "text-blue-600" : "text-muted-foreground group-hover:text-accent-foreground",
                  open ? "mr-3" : ""
                )}
              />
              {open && <span>{item.name}</span>}
            </a>
          ))}
        </nav>
        {/* User Profile */}
        <div className="border-t border-border p-4">
          <div className={cn("flex items-center", open ? "space-x-3" : "justify-center")}>
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full"></div>
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@eventpro.com</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
