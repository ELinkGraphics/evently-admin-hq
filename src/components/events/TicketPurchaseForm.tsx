
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket } from 'lucide-react';
import { Event } from '@/types/event';
import { PaymentSuccessSection } from './PaymentSuccessSection';
import { ChapaPaymentForm } from './ChapaPaymentForm';

interface TicketPurchaseFormProps {
  event: Event;
  availableTickets: number;
  soldOut: boolean;
  purchasing: boolean;
  successfulTxRef: string | null;
  ticketDownloadData: {
    buyerName: string;
    buyerEmail: string;
    ticketsQuantity: number;
    txRef: string;
  } | null;
  chapaPublicKey: string | null;
  onPurchase: (formData: PurchaseFormData) => void;
}

export interface PurchaseFormData {
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  tickets_quantity: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
  }).format(amount);
};

const getBuyerNames = (fullName: string) => {
  const [first, ...rest] = fullName.trim().split(" ");
  return { first, last: rest.join(" ") || first };
};

export const TicketPurchaseForm = ({
  event,
  availableTickets,
  soldOut,
  purchasing,
  successfulTxRef,
  ticketDownloadData,
  chapaPublicKey,
  onPurchase
}: TicketPurchaseFormProps) => {
  const [formData, setFormData] = useState<PurchaseFormData>({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    tickets_quantity: 1,
  });

  const [currentTxRef, setCurrentTxRef] = useState<string>('');

  const generateTxRef = () => {
    return `tx_${event.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  };

  const buildChapaFormValues = (tx_ref: string) => {
    const { first: buyer_first_name, last: buyer_last_name } = getBuyerNames(formData.buyer_name);
    const totalAmount = event.price * formData.tickets_quantity;

    return {
      public_key: chapaPublicKey || "",
      tx_ref,
      amount: totalAmount.toString(),
      currency: "ETB",
      email: formData.buyer_email,
      first_name: buyer_first_name,
      last_name: buyer_last_name,
      title: `${event.name} - Ticket Purchase`,
      description: `${formData.tickets_quantity} ticket(s) for ${event.name}`,
      logo: event.banner_image || "https://chapa.link/asset/images/chapa_swirl.svg",
      callback_url: `${window.location.origin}/api/chapa-callback`,
      return_url: window.location.href,
      "meta[title]": event.name || "",
      "meta[event_id]": event.id,
      "meta[tickets_quantity]": formData.tickets_quantity.toString(),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chapaPublicKey) {
      console.error('Chapa public key not available');
      return;
    }

    // Generate tx_ref for this purchase
    const tx_ref = generateTxRef();
    setCurrentTxRef(tx_ref);
    
    console.log('Generated tx_ref:', tx_ref);
    console.log('Form data:', formData);
    
    // Call parent's purchase handler
    onPurchase({ ...formData, tx_ref } as any);

    // Submit Chapa form after a short delay
    setTimeout(() => {
      const chapaForm = (window as any).chapaFormRef?.current;
      if (chapaForm) {
        console.log('Submitting Chapa form with tx_ref:', tx_ref);
        chapaForm.submit();
      } else {
        console.error('Chapa form reference not found');
      }
    }, 200);
  };

  const chapaFormValues = currentTxRef ? buildChapaFormValues(currentTxRef) : null;

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Purchase Tickets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PaymentSuccessSection
          event={event}
          successfulTxRef={successfulTxRef}
          ticketDownloadData={ticketDownloadData}
        />

        {soldOut ? (
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-destructive mb-2">Sold Out</p>
            <p className="text-muted-foreground">This event has reached its capacity.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="buyer_name">Full Name *</Label>
              <Input
                id="buyer_name"
                value={formData.buyer_name}
                onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                required
                placeholder="Enter your full name"
                disabled={purchasing}
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
                disabled={purchasing}
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
                disabled={purchasing}
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
                disabled={purchasing}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span>Price per ticket</span>
                <span>{formatCurrency(event.price)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Quantity</span>
                <span>{formData.tickets_quantity}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total Amount</span>
                  <span>{formatCurrency(event.price * formData.tickets_quantity)}</span>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={purchasing || !chapaPublicKey}
            >
              {purchasing ? 'Processing...' : 'Pay with Chapa'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You will be redirected to Chapa's secure payment page. 
              After payment, you'll return here to download your ticket.
            </p>
          </form>
        )}

        <ChapaPaymentForm
          chapaFormValues={chapaFormValues}
          soldOut={soldOut}
          successfulTxRef={successfulTxRef}
          onSubmit={() => console.log('Chapa form submitted')}
        />
      </CardContent>
    </Card>
  );
};
