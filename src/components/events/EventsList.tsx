
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CreditCard, Trash2 } from "lucide-react";
import { EventFormDialog } from "./EventFormDialog";
import { useEvents } from "@/hooks/useEvents";
import { Event } from "@/types/event";

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (time: string) => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const EventsList = () => {
  const { events, isLoading, updateEvent, deleteEvent, isUpdating, isDeleting } = useEvents();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white/60 backdrop-blur-sm border-border animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-border">
        <CardContent className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-6">Get started by creating your first event</p>
          <EventFormDialog onSubmit={updateEvent} isLoading={isUpdating} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event: Event) => (
        <Card key={event.id} className="bg-white/60 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-foreground">{event.name}</h3>
                  <Badge 
                    variant={event.status === "Active" ? "default" : "secondary"}
                    className={event.status === "Active" ? "bg-green-100 text-green-800" : ""}
                  >
                    {event.status}
                  </Badge>
                  <Badge variant="outline">{event.category}</Badge>
                </div>
                
                {event.description && (
                  <p className="text-muted-foreground mb-4">{event.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-foreground">{formatDate(event.date)}</p>
                      <p className="text-muted-foreground">
                        {formatTime(event.time_start)}
                        {event.time_end && ` - ${formatTime(event.time_end)}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-medium text-foreground">{event.attendees}/{event.capacity} attendees</p>
                      <p className="text-muted-foreground">{event.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-medium text-foreground">{formatCurrency(event.revenue)}</p>
                      <p className="text-muted-foreground">Total Revenue</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <EventFormDialog 
                  event={event} 
                  onSubmit={updateEvent} 
                  isLoading={isUpdating}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/50 hover:bg-white/80"
                  onClick={() => deleteEvent(event.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
