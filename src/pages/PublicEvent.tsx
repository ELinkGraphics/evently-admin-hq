import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, DollarSign, Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Event, TicketPurchase } from '@/types/event';
import { useToast } from '@/hooks/use-toast';
import { createChapaPaymentSession } from "@/api/chapa";
import { verifyChapaPayment } from "@/api/verifyChapaPayment";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { TicketPDF } from "@/components/events/TicketPDF";

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

const CHAPA_HTML_CHECKOUT_URL = "https://api.chapa.co/v1/hosted/pay";

const PublicEvent = () => {
  const { eventId } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    tickets_quantity: 1,
  });
  const chapaFormRef = useRef<HTMLFormElement | null>(null);
  const [chapaPublicKey, setChapaPublicKey] = useState<string | null>(null);
  const [successfulTxRef, setSuccessfulTxRef] = useState<string | null>(null);
  const [ticketDownloadData, setTicketDownloadData] = useState<{
    buyerName: string;
    buyerEmail: string;
    ticketsQuantity: number;
    txRef: string;
  } | null>(null);
  const successSectionRef = useRef<HTMLDivElement | null>(null);

  // --- SessionStorage keys ---
  const STORAGE_KEY_PREFIX = "chapa_ticket_";

  // Helper to save buyer data for a tx_ref
  const saveBuyerSessionData = (tx_ref: string) => {
    window.sessionStorage.setItem(
      STORAGE_KEY_PREFIX + tx_ref,
      JSON.stringify({
        buyerName: formData.buyer_name,
        buyerEmail: formData.buyer_email,
        ticketsQuantity: formData.tickets_quantity,
      })
    );
  };

  // Helper to load buyer data by tx_ref
  const loadBuyerSessionData = (tx_ref: string) => {
    const raw = window.sessionStorage.getItem(STORAGE_KEY_PREFIX + tx_ref);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  // Helper to extract buyer first/last names for Chapa
  const getBuyerNames = (fullName: string) => {
    const [first, ...rest] = fullName.trim().split(" ");
    return { first, last: rest.join(" ") || first };
  };

  // Chapa checkout form values generator
  const buildChapaFormValues = () => {
    const { first: buyer_first_name, last: buyer_last_name } = getBuyerNames(formData.buyer_name);
    const tx_ref = `event_${eventId}_${Date.now()}`;

    return {
      public_key: chapaPublicKey || "",
      tx_ref,
      amount: (event?.price * formData.tickets_quantity).toString(),
      currency: "ETB",
      email: formData.buyer_email,
      first_name: buyer_first_name,
      last_name: buyer_last_name,
      title: event?.name || "Event Ticket Purchase",
      description: (event?.description || "Event") + " - Ticket Purchase",
      logo: event?.banner_image || "https://chapa.link/asset/images/chapa_swirl.svg",
      callback_url: window.location.origin + "/api/chapa-callback", // Replace/implement as needed
      return_url: window.location.href,
      "meta[title]": event?.name || "",
    };
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tx_ref = url.searchParams.get("tx_ref");
    if (tx_ref) {
      // Avoid duplicate verification (e.g. after manual refresh)
      if (!window.sessionStorage.getItem("chapa_verified_" + tx_ref)) {
        handleChapaReturn(tx_ref);
      } else {
        // Already verified, rehydrate successful message and ticket data
        const sessionBuyer = loadBuyerSessionData(tx_ref);
        if (sessionBuyer) {
          setSuccessfulTxRef(tx_ref);
          setTicketDownloadData({
            buyerName: sessionBuyer.buyerName,
            buyerEmail: sessionBuyer.buyerEmail,
            ticketsQuantity: sessionBuyer.ticketsQuantity,
            txRef: tx_ref,
          });
          // Scroll to the success/download section on reload
          setTimeout(() => {
            successSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 200);
        } else {
          setSuccessfulTxRef(null);
          setTicketDownloadData(null);
        }
      }
    }
  }, []);

  useEffect(() => {
    async function fetchKey() {
      try {
        const res = await fetch(
          "https://oqxtwyvkcyzqusjurpcs.supabase.co/functions/v1/get-chapa-public-key"
        );
        const data = await res.json();
        if (data.public_key) {
          setChapaPublicKey(data.public_key);
        } else {
          setChapaPublicKey(null);
        }
      } catch (err) {
        setChapaPublicKey(null);
      }
    }
    fetchKey();
  }, []);

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

  const handleChapaReturn = async (tx_ref: string) => {
    setPurchasing(true);
    try {
      const verification = await verifyChapaPayment(tx_ref);
      window.sessionStorage.setItem("chapa_verified_" + tx_ref, "true");

      if (verification.payment_status === "completed") {
        toast({
          title: "Payment Successful",
          description: "Thank you! Your payment was successful. Download your ticket below.",
          variant: "default",
        });
        // Try to restore buyer/ticket data from session
        const sessionBuyer = loadBuyerSessionData(tx_ref);
        setSuccessfulTxRef(tx_ref);
        setTicketDownloadData({
          buyerName: sessionBuyer?.buyerName || formData.buyer_name,
          buyerEmail: sessionBuyer?.buyerEmail || formData.buyer_email,
          ticketsQuantity: sessionBuyer?.ticketsQuantity || formData.tickets_quantity,
          txRef: tx_ref,
        });
        fetchEvent();
        // Scroll to the success/download section after ticket data is set
        setTimeout(() => {
          successSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      } else {
        setSuccessfulTxRef(null);
        setTicketDownloadData(null);
        toast({
          title: "Payment Failed or Pending",
          description: "Payment verification returned: " + (verification.chapa_status || "Unknown"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setSuccessfulTxRef(null);
      setTicketDownloadData(null);
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const generateTxRef = () => {
    // Strongly unique tx_ref per event/purchase
    return `event_${eventId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
      if (!chapaPublicKey) {
        throw new Error("Payment is currently unavailable, please try again later.");
      }

      // Generate tx_ref and save formData for after redirect
      const tx_ref = generateTxRef();
      saveBuyerSessionData(tx_ref);

      // (Rebuild Chapa form values)
      // const { first, last } = getBuyerNames(formData.buyer_name);

      // Optional: update Chapa form with current tx_ref and values if needed (omitted for brevity, see buildChapaFormValues)
      // Trigger form submit to Chapa
      setTimeout(() => {
        chapaFormRef.current?.submit();
      }, 100);
    } catch (error: any) {
      console.error("Error starting payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start payment. Please try again.",
        variant: "destructive",
      });
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

  // --- Chapa form fields ---
  const chapaFormValues = buildChapaFormValues();

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
              {/* --- Success Message & PDF Ticket Download --- */}
              {successfulTxRef && ticketDownloadData && (
                <div className="mb-4" ref={successSectionRef}>
                  <div className="rounded-lg bg-green-50 border border-green-300 p-4 text-green-900 mb-2 text-center">
                    <strong>Payment successful!</strong> <br />
                    Click the button below to download your ticket as a PDF.
                  </div>
                  <PDFDownloadLink
                    document={
                      event && (
                        <TicketPDF
                          event={event}
                          buyerName={ticketDownloadData.buyerName}
                          buyerEmail={ticketDownloadData.buyerEmail}
                          ticketsQuantity={ticketDownloadData.ticketsQuantity}
                          txRef={ticketDownloadData.txRef}
                        />
                      )
                    }
                    fileName={`${event.name}_ticket.pdf`}
                    className="w-full block"
                  >
                    {({ blob, url, loading, error }) =>
                      loading ? (
                        <Button type="button" className="w-full" disabled>
                          Generating Ticket PDF...
                        </Button>
                      ) : (
                        <Button type="button" className="w-full">
                          Download Ticket PDF
                        </Button>
                      )
                    }
                  </PDFDownloadLink>
                </div>
              )}

              {/* --- Sold Out Display --- */}
              {soldOut ? (
                <div className="text-center py-8">
                  <p className="text-lg font-semibold text-destructive mb-2">Sold Out</p>
                  <p className="text-muted-foreground">This event has reached its capacity.</p>
                </div>
              ) : (
                <form onSubmit={handlePurchase} className="space-y-4">
                  {/* --- Buyer name/email/phone etc. --- */}
                  <div>
                    <Label htmlFor="buyer_name">Full Name *</Label>
                    <Input
                      id="buyer_name"
                      value={formData.buyer_name}
                      onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

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

                  {/* --- Price Preview --- */}
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

              {/* --- Chapa HTML form (hidden) --- */}
              {!soldOut && !successfulTxRef && (
                <form
                  ref={chapaFormRef}
                  action={CHAPA_HTML_CHECKOUT_URL}
                  method="POST"
                  className="hidden"
                >
                  <input type="hidden" name="public_key" value={chapaFormValues.public_key} />
                  <input type="hidden" name="tx_ref" value={chapaFormValues.tx_ref} />
                  <input type="hidden" name="amount" value={chapaFormValues.amount} />
                  <input type="hidden" name="currency" value={chapaFormValues.currency} />
                  <input type="hidden" name="email" value={chapaFormValues.email} />
                  <input type="hidden" name="first_name" value={chapaFormValues.first_name} />
                  <input type="hidden" name="last_name" value={chapaFormValues.last_name} />
                  <input type="hidden" name="title" value={chapaFormValues.title} />
                  <input type="hidden" name="description" value={chapaFormValues.description} />
                  <input type="hidden" name="logo" value={chapaFormValues.logo} />
                  <input type="hidden" name="callback_url" value={chapaFormValues.callback_url} />
                  <input type="hidden" name="return_url" value={chapaFormValues.return_url} />
                  <input type="hidden" name="meta[title]" value={chapaFormValues["meta[title]"]} />
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
