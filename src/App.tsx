import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Events from "./pages/Events";
import PublicEvent from "./pages/PublicEvent";
import NotFound from "./pages/NotFound";
import Finance from "./pages/Finance";

const queryClient = new QueryClient();

import Attendees from "./pages/Attendees";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <TooltipProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/events" element={<Events />} />
            <Route path="/attendees" element={<Attendees />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/event/:eventId" element={<PublicEvent />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
