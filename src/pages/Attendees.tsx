
import { useState } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AttendeesList } from "@/components/attendees/AttendeesList";
import { AttendeesStats } from "@/components/attendees/AttendeesStats";
import { AttendeesFilters } from "@/components/attendees/AttendeesFilters";

const Attendees = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex w-full">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Attendees</h1>
              <p className="text-muted-foreground mt-1">Manage and track your event attendees in real-time.</p>
            </div>
          </div>

          <AttendeesStats />

          <AttendeesFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            eventFilter={eventFilter}
            setEventFilter={setEventFilter}
          />

          <AttendeesList 
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            eventFilter={eventFilter}
          />
        </main>
      </div>
    </div>
  );
};

export default Attendees;
