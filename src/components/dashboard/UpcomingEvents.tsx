
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";

export const UpcomingEvents = () => {
  const { events } = useEvents();

  // Filter and sort upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming events</p>
          </div>
        ) : (
          upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-border">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{event.name}</h4>
                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{event.tickets_sold || 0}/{event.capacity}</span>
                  </div>
                </div>
              </div>
              <Badge 
                variant={event.status === "Active" ? "default" : "secondary"}
                className={event.status === "Active" ? "bg-green-100 text-green-800" : ""}
              >
                {event.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
