
import Index from "./pages/Index";
import Events from "./pages/Events";

export const navItems = [
  {
    title: "Dashboard",
    to: "/",
    page: <Index />,
  },
  {
    title: "Events", 
    to: "/events",
    page: <Events />,
  },
];
