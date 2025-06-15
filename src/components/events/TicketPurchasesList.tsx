import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Phone, Ticket, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTicketPurchases } from '@/hooks/useTicketPurchases';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface TicketPurchasesListProps {
  eventId: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    case 'refunded':
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
          <CreditCard className="w-3 h-3 mr-1" />
          Refunded
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
};

export const TicketPurchasesList = ({ eventId }: TicketPurchasesListProps) => {
  const { purchases, isLoading } = useTicketPurchases(eventId);
  const queryClient = useQueryClient();

  // Set up real-time subscription for ticket purchases
  useEffect(() => {
    console.log('[TicketPurchasesList] Setting up real-time subscription for event:', eventId);
    
    const channel = supabase
      .channel('ticket-purchases-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_purchases',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('[TicketPurchasesList] Real-time update received:', payload);
          // Invalidate the query to refetch data
          queryClient.invalidateQueries({ queryKey: ['ticket_purchases', eventId] });
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .subscribe();

    return () => {
      console.log('[TicketPurchasesList] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No purchases yet</h3>
          <p className="text-muted-foreground">Ticket purchases will appear here once people start buying tickets.</p>
        </CardContent>
      </Card>
    );
  }

  // Sort purchases by creation date (newest first)
  const sortedPurchases = [...purchases].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedPurchases.map((purchase) => (
        <Card key={purchase.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{purchase.buyer_name}</CardTitle>
              <div className="flex items-center gap-2">
                {getPaymentStatusBadge(purchase.payment_status)}
                <Badge variant="outline">
                  {purchase.tickets_quantity} ticket{purchase.tickets_quantity > 1 ? 's' : ''}
                </Badge>
                <Badge variant="secondary">
                  {formatCurrency(purchase.amount_paid)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{purchase.buyer_email}</span>
              </div>
              
              {purchase.buyer_phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span>{purchase.buyer_phone}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>{formatDate(purchase.purchase_date)}</span>
              </div>
            </div>

            {/* Payment details */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <span>Method: {purchase.payment_method.toUpperCase()}</span>
                  {purchase.chapa_transaction_id && (
                    <span>TX ID: {purchase.chapa_transaction_id}</span>
                  )}
                  {purchase.chapa_tx_ref && (
                    <span>Ref: {purchase.chapa_tx_ref}</span>
                  )}
                </div>
                {purchase.checked_in && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Checked In
                  </Badge>
                )}
              </div>
            </div>

            {/* Custom fields if any */}
            {purchase.custom_fields && Object.keys(purchase.custom_fields).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Additional Information:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {Object.entries(purchase.custom_fields).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                      <span className="text-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
