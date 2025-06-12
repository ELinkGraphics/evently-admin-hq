
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";

const upcomingEvents = [
  {
    id: 1,
    name: "Tech Conference 2025",
    date: "June 15, 2025",
    attendees: 245,
    capacity: 300,
    status: "Active",
  },
  {
    id: 2,
    name: "Music Festival",
    date: "June 22, 2025",
    attendees: 1200,
    capacity: 1500,
    status: "Active",
  },
  {
    id: 3,
    name: "Art Workshop",
    date: "June 30, 2025",
    attendees: 45,
    capacity: 50,
    status: "Draft",
  },
];

export const UpcomingEvents = () => {
  return (
    <Card className="bg-white/60 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingEvents.map((event) => (
          <div key={event.id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-border">
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">{event.name}</h4>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{event.attendees}/{event.capacity}</span>
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
        ))}
      </CardContent>
    </Card>
  );
};
