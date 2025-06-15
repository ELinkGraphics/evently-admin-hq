
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, DollarSign, Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Event, TicketPurchase } from '@/types/event';
import { useToast } from '@/hooks/use-toast';
import { useEventCustomFields } from '@/hooks/useEventCustomFields';
import { CustomFieldsForm } from '@/components/events/CustomFieldsForm';

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

const PublicEvent = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Check for payment success/failure from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const txRef = searchParams.get('tx_ref');
    
    if (paymentStatus === 'success' && txRef) {
      // Verify the payment
      verifyPayment(txRef);
    } else if (paymentStatus === 'failed') {
      toast({
        title: "Payment Failed",
        description: "Your payment could not be processed. Please try again.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const verifyPayment = async (txRef: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-chapa-payment', {
        body: { tx_ref: txRef, status: 'success' }
      });

      if (error) throw error;

      if (data.verified) {
        toast({
          title: "Payment Successful!",
          description: "Your tickets have been purchased successfully. You will receive a confirmation email shortly.",
        });
        fetchEvent(); // Refresh event data
      } else {
        toast({
          title: "Payment Verification Failed",
          description: "We couldn't verify your payment. Please contact support if you were charged.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Verification Error",
        description: "Error verifying payment. Please contact support if you were charged.",
        variant: "destructive",
      });
    }
  };

  // new: for dynamic fields
  const { data: customFields = [] } = useEventCustomFields(eventId);

  // Split "buyer name" into first and last, keep email/phone/quantity, plus dynamic custom fields
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    buyer_email: '',
    buyer_phone: '',
    tickets_quantity: 1,
  });

  // Track dynamic field values
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      
      // Cast the status to the correct type
      const eventData: Event = {
        ...data,
        status: data.status as 'Draft' | 'Active' | 'Cancelled' | 'Completed'
      };
      
      setEvent(eventData);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Event not found or not available for purchase.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setPurchasing(true);
    try {
      const totalAmount = event.price * formData.tickets_quantity;
      const availableTickets = event.capacity - (event.tickets_sold || 0);
      if (formData.tickets_quantity > availableTickets) {
        throw new Error(`Only ${availableTickets} tickets available`);
      }

      // Make sure all required dynamic fields are present
      for (const field of customFields) {
        if (field.is_required && !customFieldValues[field.field_name]) {
          throw new Error(`Please fill in the required field: ${field.field_label}`);
        }
      }
      // Ensure first and last name for Chapa
      if (!formData.first_name.trim() || !formData.last_name.trim()) {
        throw new Error("Please enter your first and last name.");
      }

      // Initialize Chapa payment
      const { data, error } = await supabase.functions.invoke('initialize-chapa-payment', {
        body: {
          eventId: event.id,
          firstName: formData.first_name,
          lastName: formData.last_name,
          email: formData.buyer_email,
          phone: formData.buyer_phone,
          quantity: formData.tickets_quantity,
          customFields: customFieldValues,
          eventName: event.name,
          eventDescription: event.description,
          eventBannerImage: event.banner_image
        }
      });

      if (error) throw error;

      if (data.success) {
        // Create Chapa HTML checkout form and auto-submit
        const form = document.createElement('form');
        form.method = 'POST';
        // Update to correct Chapa endpoint!
        form.action = 'https://api.chapa.co/v1/hosted/pay';
        form.style.display = 'none';

        // Add all Chapa payload fields as hidden inputs
        Object.entries(data.chapaPayload).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = typeof value === 'object' ? JSON.stringify(value) : String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);

        console.log('Submitting form to Chapa with payload:', data.chapaPayload);

        form.submit();
        document.body.removeChild(form);

        toast({
          title: "Redirecting to Payment",
          description: "You are being redirected to Chapa for secure payment processing...",
        });
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }

    } catch (error: any) {
      console.error('Error purchasing tickets:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to purchase tickets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Event Not Found</h3>
            <p className="text-muted-foreground">This event is not available for purchase or does not exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableTickets = event.capacity - (event.tickets_sold || 0);
  const soldOut = availableTickets <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Details */}
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

          {/* Purchase Form */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Purchase Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {soldOut ? (
                <div className="text-center py-8">
                  <p className="text-lg font-semibold text-destructive mb-2">Sold Out</p>
                  <p className="text-muted-foreground">This event has reached its capacity.</p>
                </div>
              ) : (
                <form onSubmit={handlePurchase} className="space-y-4">
                  {/* First name / last name for Chapa */}
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                      placeholder="Enter your last name"
                    />
                  </div>
                  {/* Email/phone/quantity */}
                  <div>
                    <Label htmlFor="buyer_email">Email Address *</Label>
                    <Input
                      id="buyer_email"
                      type="email"
                      value={formData.buyer_email}
                      onChange={(e) => setFormData({ ...formData, buyer_email: e.target.value })}
                      required
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyer_phone">Phone Number</Label>
                    <Input
                      id="buyer_phone"
                      type="tel"
                      value={formData.buyer_phone}
                      onChange={(e) => setFormData({ ...formData, buyer_phone: e.target.value })}
                      placeholder="Enter your phone number (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tickets_quantity">Number of Tickets *</Label>
                    <Input
                      id="tickets_quantity"
                      type="number"
                      min="1"
                      max={availableTickets}
                      value={formData.tickets_quantity}
                      onChange={(e) => setFormData({ ...formData, tickets_quantity: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                  {/* Dynamic custom fields */}
                  <CustomFieldsForm
                    customFields={customFields}
                    fieldValues={customFieldValues}
                    setFieldValues={setCustomFieldValues}
                    disabled={purchasing}
                  />
                  {/* Summary */}
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span>Tickets ({formData.tickets_quantity}x)</span>
                      <span>{formatCurrency(event.price * formData.tickets_quantity)}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(event.price * formData.tickets_quantity)}</span>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={purchasing}
                  >
                    {purchasing ? 'Processing...' : 'Purchase Tickets'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By purchasing tickets, you agree to our terms and conditions. 
                    You will receive a confirmation email with your ticket details.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicEvent;
