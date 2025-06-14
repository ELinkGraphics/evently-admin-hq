import { useState, useEffect } from 'react';
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

  // SessionStorage keys for buyer data persistence
  const STORAGE_KEY_PREFIX = "chapa_buyer_";
  const VERIFIED_KEY_PREFIX = "chapa_verified_";

  const saveBuyerSessionData = (tx_ref: string, formData: PurchaseFormData) => {
    try {
      const buyerData = {
        buyerName: formData.buyer_name,
        buyerEmail: formData.buyer_email,
        ticketsQuantity: formData.tickets_quantity,
      };
      
      window.sessionStorage.setItem(
        STORAGE_KEY_PREFIX + tx_ref,
        JSON.stringify(buyerData)
      );
      console.log('Buyer data saved to session storage for tx_ref:', tx_ref);
    } catch (err) {
      console.error('Error saving buyer session data:', err);
    }
  };

  const loadBuyerSessionData = (tx_ref: string) => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY_PREFIX + tx_ref);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error('Error loading buyer session data:', err);
      return null;
    }
  };

  const markPaymentAsVerified = (tx_ref: string) => {
    try {
      window.sessionStorage.setItem(VERIFIED_KEY_PREFIX + tx_ref, "true");
    } catch (err) {
      console.error('Error marking payment as verified:', err);
    }
  };

  const isPaymentAlreadyVerified = (tx_ref: string) => {
    try {
      return window.sessionStorage.getItem(VERIFIED_KEY_PREFIX + tx_ref) === "true";
    } catch (err) {
      console.error('Error checking verification status:', err);
      return false;
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  useEffect(() => {
    fetchChapaPublicKey();
  }, []);

  useEffect(() => {
    // Check URL parameters for Chapa return
    const url = new URL(window.location.href);
    const tx_ref = url.searchParams.get("tx_ref");
    const status = url.searchParams.get("status");
    
    console.log('URL parameters:', { tx_ref, status });
    
    if (tx_ref) {
      if (!isPaymentAlreadyVerified(tx_ref)) {
        console.log('Starting payment verification for tx_ref:', tx_ref);
        handleChapaReturn(tx_ref);
      } else {
        console.log('Payment already verified, loading cached data');
        const sessionBuyer = loadBuyerSessionData(tx_ref);
        if (sessionBuyer) {
          setSuccessfulTxRef(tx_ref);
          setTicketDownloadData({
            ...sessionBuyer,
            txRef: tx_ref,
          });
        }
      }
    }
  }, []);

  const fetchEvent = async () => {
    try {
      console.log('Fetching event:', eventId);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('is_published', true)
        .single();

      if (error) {
        console.error('Event fetch error:', error);
        throw error;
      }
      
      const eventData: Event = {
        ...data,
        status: data.status as 'Draft' | 'Active' | 'Cancelled' | 'Completed',
        tickets_sold: data.tickets_sold || 0,
        revenue: data.revenue || 0,
        attendees: data.attendees || 0,
        price: data.price || 0,
      };
      
      console.log('Event loaded successfully:', eventData.name);
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

  const fetchChapaPublicKey = async () => {
    try {
      console.log('Fetching Chapa public key...');
      const response = await fetch(
        "https://oqxtwyvkcyzqusjurpcs.supabase.co/functions/v1/get-chapa-public-key",
        {
          headers: {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xeHR3eXZrY3l6cXVzanVycGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MzE5MjQsImV4cCI6MjA2NTMwNzkyNH0.IcQKOaM0D6BpA6tmarNivD28xobxosNE0Qq455z631E",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Chapa public key fetched successfully');
      
      if (data.public_key) {
        setChapaPublicKey(data.public_key);
      } else {
        console.error('No public key in response');
        setChapaPublicKey(null);
      }
    } catch (err) {
      console.error('Error fetching Chapa public key:', err);
      setChapaPublicKey(null);
      toast({
        title: "Warning",
        description: "Payment service temporarily unavailable. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleChapaReturn = async (tx_ref: string) => {
    console.log('Processing Chapa payment return for tx_ref:', tx_ref);
    setPurchasing(true);
    
    try {
      const verification = await verifyChapaPayment(tx_ref);
      console.log('Payment verification result:', verification);
      
      // Mark as verified to prevent duplicate calls
      markPaymentAsVerified(tx_ref);

      if (verification.payment_status === "completed") {
        console.log('Payment completed successfully');
        
        // Use buyer info from verification response or session storage
        let buyerData = null;
        
        if (verification.buyer_info && verification.buyer_info.name && verification.buyer_info.email) {
          buyerData = {
            buyerName: verification.buyer_info.name,
            buyerEmail: verification.buyer_info.email,
            ticketsQuantity: verification.tickets_quantity || 1,
          };
        } else {
          // Fall back to session storage
          buyerData = loadBuyerSessionData(tx_ref);
        }
        
        if (buyerData) {
          setSuccessfulTxRef(tx_ref);
          setTicketDownloadData({
            ...buyerData,
            txRef: tx_ref,
          });
          
          // Refresh event data to show updated ticket count
          await fetchEvent();
          
          toast({
            title: "Payment Successful! 🎉",
            description: "Your tickets have been purchased successfully. You can now download your ticket PDF.",
            duration: 6000,
          });
        } else {
          console.error('No buyer data found');
          toast({
            title: "Payment Successful",
            description: "Payment completed but buyer information was not found. Please contact support.",
            variant: "destructive",
          });
        }
      } else {
        console.log('Payment not completed. Status:', verification.payment_status);
        setSuccessfulTxRef(null);
        setTicketDownloadData(null);
        
        toast({
          title: "Payment Issue",
          description: `Payment status: ${verification.chapa_status || 'Unknown'}. Please try again or contact support.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setSuccessfulTxRef(null);
      setTicketDownloadData(null);
      
      toast({
        title: "Verification Error",
        description: error.message || "Could not verify payment. Please contact support if you were charged.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchase = async (formData: PurchaseFormData & { tx_ref: string }) => {
    if (!event) {
      console.error('No event data available');
      return;
    }
    
    console.log('Starting purchase process with tx_ref:', formData.tx_ref);
    setPurchasing(true);

    try {
      const availableTickets = event.capacity - (event.tickets_sold || 0);
      
      if (formData.tickets_quantity > availableTickets) {
        throw new Error(`Only ${availableTickets} tickets available`);
      }
      
      if (!chapaPublicKey) {
        throw new Error("Payment service is currently unavailable. Please try again later.");
      }

      // Save buyer data before redirect
      saveBuyerSessionData(formData.tx_ref, formData);
      console.log('Purchase initiated, buyer data saved. Redirecting to Chapa...');
      
    } catch (error: any) {
      console.error("Error initiating purchase:", error);
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
          <p className="text-muted-foreground">Loading event details...</p>
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
            <p className="text-muted-foreground">
              This event is not available for purchase or does not exist.
            </p>
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
