
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Events from "./pages/Events";
import Attendees from "./pages/Attendees";
import Finance from "./pages/Finance";
import Payments from "./pages/Payments";
import PublicEvent from "./pages/PublicEvent";
import NotFound from "./pages/NotFound";
import TicketConfirmation from "./pages/TicketConfirmation";
import AuthPage from "./components/auth/AuthPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/event/:eventId" element={<PublicEvent />} />
            <Route path="/ticket-confirmation" element={<TicketConfirmation />} />
            
            {/* Protected admin routes */}
            <Route path="/" element={
              <ProtectedRoute requiredRole="viewer">
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute requiredRole="moderator">
                <Events />
              </ProtectedRoute>
            } />
            <Route path="/attendees" element={
              <ProtectedRoute requiredRole="viewer">
                <Attendees />
              </ProtectedRoute>
            } />
            <Route path="/finance" element={
              <ProtectedRoute requiredRole="moderator">
                <Finance />
              </ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute requiredRole="moderator">
                <Payments />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
