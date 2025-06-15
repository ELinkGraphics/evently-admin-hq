
import { useRef } from "react";
import { Event, TicketPurchase } from "@/types/event";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";

interface TicketDownloadCardProps {
  purchase: TicketPurchase;
  event: Event;
}

export const TicketDownloadCard = ({ purchase, event }: TicketDownloadCardProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!ticketRef.current) return;
    try {
      const canvas = await html2canvas(ticketRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`ticket-${purchase.chapa_tx_ref || purchase.id}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  };

  // Safe date formatting
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Date unavailable";
    }
  };

  // Removed QR code

  return (
    <div className="w-full flex flex-col items-center mt-4">
      <Card className="w-full max-w-md border-2 border-primary" ref={ticketRef}>
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-lg font-bold text-primary">Your Ticket</h2>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />
          </div>
          <div className="flex flex-col items-center gap-2 mb-4">
            <span className="font-semibold">{event.name || "Event"}</span>
            <Badge variant="outline">{event.category || "Category"}</Badge>
          </div>
          <div className="flex justify-between mb-2">
            <span>Buyer:</span>
            <span className="font-semibold">{purchase.buyer_name || "N/A"}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Date:</span>
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Tickets:</span>
            <span>{purchase.tickets_quantity || 1}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Transaction Ref:</span>
            <span className="font-mono text-xs">{purchase.chapa_tx_ref || purchase.id || "N/A"}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Seat Number:</span>
            <span>-</span>
          </div>
          {/* QR code removed */}
        </CardContent>
      </Card>
      <Button className="mt-4" onClick={downloadPDF}>Download Ticket (PDF)</Button>
    </div>
  );
};

