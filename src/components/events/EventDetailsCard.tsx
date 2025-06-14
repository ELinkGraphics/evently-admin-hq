
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { Event } from '@/types/event';

interface EventDetailsCardProps {
  event: Event;
  availableTickets: number;
  soldOut: boolean;
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

export const EventDetailsCard = ({ event, availableTickets, soldOut }: EventDetailsCardProps) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <CardTitle className="text-2xl">{event.name}</CardTitle>
          <Badge variant="outline">{event.category}</Badge>
          {soldOut && <Badge variant="destructive">Sold Out</Badge>}
        </div>
        {event.banner_image && (
          <img 
            src={event.banner_image} 
            alt={event.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {event.description && (
          <p className="text-muted-foreground">{event.description}</p>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">{formatDate(event.date)}</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(event.time_start)}
                {event.time_end && ` - ${formatTime(event.time_end)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-red-600" />
            <p>{event.location}</p>
          </div>

          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-purple-600" />
            <p>{availableTickets} of {event.capacity} tickets available</p>
          </div>

          <div className="flex items-center space-x-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <p className="text-xl font-bold">{formatCurrency(event.price)} per ticket</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
