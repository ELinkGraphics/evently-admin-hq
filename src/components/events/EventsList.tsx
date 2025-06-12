
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CreditCard, Edit } from "lucide-react";

const events = [
  {
    id: 1,
    name: "Tech Conference 2025",
    description: "Annual technology conference featuring industry leaders and innovative solutions.",
    date: "June 15, 2025",
    time: "9:00 AM - 6:00 PM",
    location: "Convention Center",
    attendees: 245,
    capacity: 300,
    revenue: "$12,250",
    status: "Active",
    category: "Conference",
  },
  {
    id: 2,
    name: "Music Festival",
    description: "Three-day music festival with top artists from around the world.",
    date: "June 22-24, 2025",
    time: "All Day",
    location: "Central Park",
    attendees: 1200,
    capacity: 1500,
    revenue: "$45,000",
    status: "Active",
    category: "Music",
  },
  {
    id: 3,
    name: "Art Workshop",
    description: "Interactive art workshop for beginners and intermediate artists.",
    date: "June 30, 2025",
    time: "2:00 PM - 5:00 PM",
    location: "Art Studio Downtown",
    attendees: 45,
    capacity: 50,
    revenue: "$3,375",
    status: "Draft",
    category: "Workshop",
  },
];

export const EventsList = () => {
  return (
    <div className="space-y-4">
      {events.map((event) => (
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
                
                <p className="text-muted-foreground mb-4">{event.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-foreground">{event.date}</p>
                      <p className="text-muted-foreground">{event.time}</p>
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
                      <p className="font-medium text-foreground">{event.revenue}</p>
                      <p className="text-muted-foreground">Total Revenue</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
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
