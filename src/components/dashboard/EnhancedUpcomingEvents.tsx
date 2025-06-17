
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, Edit, Eye, Share } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useToast } from "@/hooks/use-toast";

export const EnhancedUpcomingEvents = () => {
  const { events, publishEvent } = useEvents();
  const { toast } = useToast();

  // Filter and sort upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCapacityPercentage = (ticketsSold: number, capacity: number) => {
    return capacity > 0 ? (ticketsSold / capacity) * 100 : 0;
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleEditEvent = (eventId: string) => {
    toast({
      title: "Edit Event",
      description: `Edit functionality for event ${eventId} coming soon!`,
    });
  };

  const handleViewDetails = (eventId: string) => {
    toast({
      title: "View Details",
      description: `Detailed view for event ${eventId} coming soon!`,
    });
  };

  const handleShareEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event?.public_link) {
      navigator.clipboard.writeText(event.public_link);
      toast({
        title: "Link Copied",
        description: "Event link copied to clipboard!",
      });
    } else {
      toast({
        title: "Share Event",
        description: "Event needs to be published first to generate a shareable link.",
        variant: "destructive",
      });
    }
  };

  const handlePublishEvent = (eventId: string) => {
    publishEvent(eventId);
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground">Upcoming Events</CardTitle>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming events</p>
          </div>
        ) : (
          upcomingEvents.map((event) => {
            const capacityPercentage = getCapacityPercentage(event.tickets_sold || 0, event.capacity);
            
            return (
              <div key={event.id} className="p-4 bg-white/50 rounded-lg border border-border hover:bg-white/70 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">{event.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={event.status === "Active" ? "default" : "secondary"}
                      className={event.status === "Active" ? "bg-green-100 text-green-800" : ""}
                    >
                      {event.status}
                    </Badge>
                  </div>
                </div>

                {/* Capacity indicator */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Capacity</span>
                    <span>{capacityPercentage.toFixed(0)}% filled</span>
                  </div>
                  <Progress 
                    value={capacityPercentage} 
                    className="h-2"
                  />
                </div>

                {/* Quick actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(event.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditEvent(event.id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShareEvent(event.id)}
                    >
                      <Share className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                  
                  {event.status === "Draft" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePublishEvent(event.id)}
                    >
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
