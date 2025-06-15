import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Event, TicketPurchase } from "@/types/event";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketDownloadCard } from "@/components/events/TicketDownloadCard";

const TicketConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [purchase, setPurchase] = useState<TicketPurchase | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const tx_ref = searchParams.get("tx_ref");
    if (!tx_ref) {
      setErrorMsg("Missing transaction reference.");
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg("");
      setPurchase(null);
      setEvent(null);

      console.log("[TicketConfirmation] Fetching ticket purchase for tx_ref:", tx_ref);

      // fetch purchase with matching chapa_tx_ref
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("ticket_purchases")
        .select("*")
        .eq("chapa_tx_ref", tx_ref)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (purchaseError || !purchaseData) {
        setErrorMsg("Ticket not found or purchase was not successful.");
        setLoading(false);
        return;
      }
      setPurchase(purchaseData);

      // Fetch associated event
      if (!purchaseData.event_id) {
        setErrorMsg("Could not find an event for this ticket.");
        setLoading(false);
        return;
      }
      console.log("[TicketConfirmation] Fetching event for event_id:", purchaseData.event_id);
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", purchaseData.event_id)
        .maybeSingle();

      if (eventError || !eventData) {
        setErrorMsg("Event not found for this ticket.");
        setLoading(false);
        return;
      }
      setEvent({ ...eventData, status: eventData.status as Event["status"] });
      setLoading(false);
    };

    fetchData();
  }, [searchParams]);

  // Strong null/undefined guard with logging for all loading/error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Ticket Not Found</h3>
            <p className="text-muted-foreground">{errorMsg}</p>
            <Button className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Defensive: check if purchase and event are both objects with required string fields
  if (
    !purchase ||
    !event ||
    typeof purchase !== "object" ||
    typeof event !== "object" ||
    typeof purchase.id !== "string" ||
    typeof purchase.buyer_name !== "string" ||
    typeof event.name !== "string" ||
    typeof event.date === "undefined" ||
    !purchase.id ||
    !purchase.buyer_name ||
    !event.name
  ) {
    console.error("[TicketConfirmation] Defensive guard failed. Values:", { purchase, event });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Ticket Not Ready</h3>
            <p className="text-muted-foreground">
              We could not find a valid ticket for your reference number.<br />
              Possible causes: payment not completed, info delay, or data error.<br />
              Please contact event support if this persists.
            </p>
            <Button className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-xl w-full">
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center">
              <svg className="h-10 w-10 text-green-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
              <h2 className="text-2xl font-bold mb-2">Purchase Successful</h2>
              <div className="mb-4">
                Thank you, <span className="font-semibold">{purchase.buyer_name}</span>! Your ticket for <span className="font-semibold">{event.name}</span> on {" "}
                <span>{new Date(event.date).toLocaleDateString()}</span> has been purchased.
              </div>
              <div>
                <TicketDownloadCard purchase={purchase} event={event} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketConfirmation;
