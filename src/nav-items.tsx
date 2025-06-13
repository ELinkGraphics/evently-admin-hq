
import { HomeIcon, Calendar, Users } from "lucide-react";

export const navItems = [
  {
    title: "Dashboard",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
  },
  {
    title: "Events",
    to: "/events",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    title: "Attendees",
    to: "/attendees",
    icon: <Users className="h-4 w-4" />,
  },
];
