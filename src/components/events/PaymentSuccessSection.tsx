
import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PDFDownloadLink } from "@react-pdf/renderer";
import { TicketPDF } from "@/components/events/TicketPDF";
import { Event } from '@/types/event';

interface PaymentSuccessSectionProps {
  event: Event | null;
  successfulTxRef: string | null;
  ticketDownloadData: {
    buyerName: string;
    buyerEmail: string;
    ticketsQuantity: number;
    txRef: string;
  } | null;
}

export const PaymentSuccessSection = ({ 
  event, 
  successfulTxRef, 
  ticketDownloadData 
}: PaymentSuccessSectionProps) => {
  const successSectionRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to success section when it appears
  useEffect(() => {
    if (successfulTxRef && ticketDownloadData) {
      console.log('Success section mounted, auto-scrolling...');
      setTimeout(() => {
        if (successSectionRef.current) {
          successSectionRef.current.scrollIntoView({ 
            behavior: "smooth", 
            block: "center" 
          });
        }
      }, 100);
    }
  }, [successfulTxRef, ticketDownloadData]);

  if (!successfulTxRef || !ticketDownloadData || !event) {
    return null;
  }

  console.log('Rendering success section with data:', { successfulTxRef, ticketDownloadData });

  return (
    <div className="mb-4" ref={successSectionRef}>
      <div className="rounded-lg bg-green-50 border border-green-300 p-4 text-green-900 mb-2 text-center">
        <strong>🎉 Payment Successful!</strong> <br />
        Your tickets have been purchased successfully. Click the button below to download your ticket as a PDF.
      </div>
      <PDFDownloadLink
        document={
          <TicketPDF
            event={event}
            buyerName={ticketDownloadData.buyerName}
            buyerEmail={ticketDownloadData.buyerEmail}
            ticketsQuantity={ticketDownloadData.ticketsQuantity}
            txRef={ticketDownloadData.txRef}
          />
        }
        fileName={`${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_ticket_${ticketDownloadData.txRef}.pdf`}
        className="w-full block"
      >
        {({ blob, url, loading, error }) => {
          if (error) {
            console.error('PDF generation error:', error);
            return (
              <Button type="button" className="w-full" variant="destructive" disabled>
                Error generating PDF
              </Button>
            );
          }
          
          return loading ? (
            <Button type="button" className="w-full" disabled>
              Generating Ticket PDF...
            </Button>
          ) : (
            <Button type="button" className="w-full bg-green-600 hover:bg-green-700">
              📄 Download Ticket PDF
            </Button>
          );
        }}
      </PDFDownloadLink>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Keep your ticket safe and present it at the event entrance.
      </p>
    </div>
  );
};
