
import { useRef } from 'react';
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

  if (!successfulTxRef || !ticketDownloadData || !event) {
    return null;
  }

  return (
    <div className="mb-4" ref={successSectionRef}>
      <div className="rounded-lg bg-green-50 border border-green-300 p-4 text-green-900 mb-2 text-center">
        <strong>Payment successful!</strong> <br />
        Click the button below to download your ticket as a PDF.
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
  );
};
