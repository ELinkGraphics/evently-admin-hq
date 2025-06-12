
import { Button } from "@/components/ui/button";
import { Calendar, Users, BarChart3 } from "lucide-react";
import { EventFormDialog } from "@/components/events/EventFormDialog";
import { useEvents } from "@/hooks/useEvents";

export const QuickActions = () => {
  const { createEvent, isCreating } = useEvents();

  return (
    <div className="flex space-x-3">
      <EventFormDialog onSubmit={createEvent} isLoading={isCreating} />
      <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80">
        <Users className="w-4 h-4 mr-2" />
        View Orders
      </Button>
      <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80">
        <BarChart3 className="w-4 h-4 mr-2" />
        Analytics
      </Button>
    </div>
  );
};
