
import {
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  DollarSignIcon,
  CreditCardIcon,
} from "lucide-react";

export const navItems = [
  {
    title: "Dashboard",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
  },
  {
    title: "Events",
    to: "/events",
    icon: <CalendarIcon className="h-4 w-4" />,
  },
  {
    title: "Attendees",
    to: "/attendees",
    icon: <UsersIcon className="h-4 w-4" />,
  },
  {
    title: "Finance",
    to: "/finance",
    icon: <DollarSignIcon className="h-4 w-4" />,
  },
  {
    title: "Payments",
    to: "/payments",
    icon: <CreditCardIcon className="h-4 w-4" />,
  },
];
