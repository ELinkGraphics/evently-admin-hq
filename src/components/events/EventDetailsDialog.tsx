
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Globe, Copy, Users } from 'lucide-react';
import { Event } from '@/types/event';
import { EventTicketPreview } from './EventTicketPreview';
import { TicketPurchasesList } from './TicketPurchasesList';
import { useEvents } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';

interface EventDetailsDialogProps {
  event: Event;
}

export const EventDetailsDialog = ({ event }: EventDetailsDialogProps) => {
  const [open, setOpen] = useState(false);
  const { publishEvent, isPublishing } = useEvents();
  const { toast } = useToast();

  const handlePublish = () => {
    publishEvent(event.id);
  };

  const copyPublicLink = () => {
    if (event.public_link) {
      navigator.clipboard.writeText(event.public_link);
      toast({
        title: "Link copied!",
        description: "Public event link copied to clipboard.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {event.name}
            <Badge variant={event.is_published ? "default" : "secondary"}>
              {event.is_published ? "Published" : "Draft"}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Ticket Preview</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Ticket Preview</h3>
                <EventTicketPreview event={event} />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Event Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Tickets Sold</p>
                    <p className="text-2xl font-semibold">{event.tickets_sold || 0}/{event.capacity}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-semibold">${event.revenue || 0}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-2xl font-semibold">{event.capacity - (event.tickets_sold || 0)}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-2xl font-semibold">${event.price}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="management" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Event Management</h3>
              
              {!event.is_published ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Publish this event to make it available for ticket purchases and generate a public link.
                  </p>
                  <Button 
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="w-full"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    {isPublishing ? 'Publishing...' : 'Publish Event'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium mb-2">Event Published!</p>
                    <p className="text-green-700 text-sm mb-3">
                      Your event is now live and available for ticket purchases.
                    </p>
                    
                    {event.public_link && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-800">Public Link:</p>
                        <div className="flex items-center space-x-2">
                          <input 
                            readOnly 
                            value={event.public_link}
                            className="flex-1 px-3 py-2 text-sm bg-white border border-green-300 rounded"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={copyPublicLink}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Event Details */}
            <div>
              <h4 className="font-semibold mb-3">Event Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Category:</span> {event.category}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {event.status}
                </div>
                <div>
                  <span className="font-medium">Price:</span> ${event.price}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {event.location}
                </div>
                {event.description && (
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-muted-foreground">{event.description}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="purchases">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Ticket Purchases
              </h3>
              <TicketPurchasesList eventId={event.id} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
