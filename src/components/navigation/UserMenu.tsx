
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Settings } from "lucide-react";

export const UserMenu = () => {
  const { user, profile } = useAuth();

  // Show a default user when no authentication
  const displayName = profile?.full_name || user?.email || 'Guest User';
  const userRole = profile?.role || 'admin';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-3 h-10 px-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-primary text-white text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-foreground">{displayName}</span>
            <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs h-4 px-1.5">
              {userRole}
            </Badge>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-lg">
        <DropdownMenuLabel className="pb-2">
          <div className="flex flex-col">
            <span className="font-medium text-popover-foreground">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {user?.email || 'No authentication required'}
            </span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer">
          <User className="w-4 h-4 mr-2" />
          Profile Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Preferences
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
