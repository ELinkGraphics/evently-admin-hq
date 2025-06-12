
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, DollarSign } from "lucide-react";
import { Event } from "@/types/event";

interface EventTicketPreviewProps {
  event: Event;
  buyerName?: string;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
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

export const EventTicketPreview = ({ event, buyerName = "John Doe" }: EventTicketPreviewProps) => {
  return (
    <Card className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-primary">
      <CardContent className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">Event Ticket</h2>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
        </div>

        {/* Event Details */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-1">{event.name}</h3>
            <Badge variant="outline" className="text-xs">{event.category}</Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{formatDate(event.date)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div className="text-sm">
                <p>{formatTime(event.time_start)}
                  {event.time_end && ` - ${formatTime(event.time_end)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div className="text-sm">
                <p>{event.location}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <DollarSign className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold">{formatCurrency(event.price)}</p>
              </div>
            </div>
          </div>

          {/* Ticket Holder */}
          <div className="border-t border-dashed border-border pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">TICKET HOLDER</p>
              <p className="font-semibold text-foreground">{buyerName}</p>
            </div>
          </div>

          {/* Ticket ID */}
          <div className="border-t border-dashed border-border pt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">TICKET ID</p>
              <p className="font-mono text-xs text-foreground">{event.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-2"></div>
          <p className="text-xs text-muted-foreground">Present this ticket at the event entrance</p>
        </div>
      </CardContent>
    </Card>
  );
};
