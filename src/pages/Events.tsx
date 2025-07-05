
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { EventsList } from "@/components/events/EventsList";
import { EventFilters } from "@/components/events/EventFilters";
import { EventFormDialog } from "@/components/events/EventFormDialog";
import { useEvents } from "@/hooks/useEvents";

const Events = () => {
  const { createEvent, isCreating } = useEvents();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppHeader />
          
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight">Events</h1>
                  <p className="text-muted-foreground">
                    Manage all your events in one place.
                  </p>
                </div>
                <EventFormDialog onSubmit={createEvent} isLoading={isCreating} />
              </div>

              <EventFilters />
              <EventsList />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Events;
