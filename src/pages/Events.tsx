
import { useState } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EventsList } from "@/components/events/EventsList";
import { EventFilters } from "@/components/events/EventFilters";

const Events = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex w-full">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Events</h1>
              <p className="text-muted-foreground mt-1">Manage all your events in one place.</p>
            </div>
          </div>

          <EventFilters />
          <EventsList />
        </main>
      </div>
    </div>
  );
};

export default Events;
