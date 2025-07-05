
import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { AttendeesList } from "@/components/attendees/AttendeesList";
import { AttendeesStats } from "@/components/attendees/AttendeesStats";
import { AttendeesFilters } from "@/components/attendees/AttendeesFilters";

const Attendees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppHeader />
          
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 space-y-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Attendees</h1>
                <p className="text-muted-foreground">
                  Manage and track your event attendees in real-time.
                </p>
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
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Attendees;
