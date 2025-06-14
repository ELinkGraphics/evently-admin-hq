
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types/event';
import { useToast } from '@/hooks/use-toast';
import { verifyChapaPayment } from "@/api/verifyChapaPayment";
import { EventDetailsCard } from '@/components/events/EventDetailsCard';
import { TicketPurchaseForm, PurchaseFormData } from '@/components/events/TicketPurchaseForm';

const PublicEvent = () => {
  const { eventId } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [chapaPublicKey, setChapaPublicKey] = useState<string | null>(null);
  const [successfulTxRef, setSuccessfulTxRef] = useState<string | null>(null);
  const [ticketDownloadData, setTicketDownloadData] = useState<{
    buyerName: string;
    buyerEmail: string;
    ticketsQuantity: number;
    txRef: string;
  } | null>(null);
  const successSectionRef = useRef<HTMLDivElement | null>(null);

  // SessionStorage keys
  const STORAGE_KEY_PREFIX = "chapa_ticket_";

  // Helper to save buyer data for a tx_ref
  const saveBuyerSessionData = (tx_ref: string, formData: PurchaseFormData) => {
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

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tx_ref = url.searchParams.get("tx_ref");
    if (tx_ref) {
      if (!window.sessionStorage.getItem("chapa_verified_" + tx_ref)) {
        handleChapaReturn(tx_ref);
      } else {
        const sessionBuyer = loadBuyerSessionData(tx_ref);
        if (sessionBuyer) {
          setSuccessfulTxRef(tx_ref);
          setTicketDownloadData({
            buyerName: sessionBuyer.buyerName,
            buyerEmail: sessionBuyer.buyerEmail,
            ticketsQuantity: sessionBuyer.ticketsQuantity,
            txRef: tx_ref,
          });
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
        const sessionBuyer = loadBuyerSessionData(tx_ref);
        setSuccessfulTxRef(tx_ref);
        setTicketDownloadData({
          buyerName: sessionBuyer?.buyerName || '',
          buyerEmail: sessionBuyer?.buyerEmail || '',
          ticketsQuantity: sessionBuyer?.ticketsQuantity || 1,
          txRef: tx_ref,
        });
        fetchEvent();
        setTimeout(() => {
          successSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 500);
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

  const handlePurchase = async (formData: PurchaseFormData & { tx_ref: string }) => {
    if (!event) return;
    setPurchasing(true);

    try {
      const availableTickets = event.capacity - (event.tickets_sold || 0);

      if (formData.tickets_quantity > availableTickets) {
        throw new Error(`Only ${availableTickets} tickets available`);
      }
      if (!chapaPublicKey) {
        throw new Error("Payment is currently unavailable, please try again later.");
      }

      saveBuyerSessionData(formData.tx_ref, formData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <EventDetailsCard
            event={event}
            availableTickets={availableTickets}
            soldOut={soldOut}
          />

          <TicketPurchaseForm
            event={event}
            availableTickets={availableTickets}
            soldOut={soldOut}
            purchasing={purchasing}
            successfulTxRef={successfulTxRef}
            ticketDownloadData={ticketDownloadData}
            chapaPublicKey={chapaPublicKey}
            onPurchase={handlePurchase}
          />
        </div>
      </div>
    </div>
  );
};

export default PublicEvent;
