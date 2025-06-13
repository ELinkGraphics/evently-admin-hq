
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Phone, Ticket } from 'lucide-react';
import { useTicketPurchases } from '@/hooks/useTicketPurchases';

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

export const TicketPurchasesList = ({ eventId }: TicketPurchasesListProps) => {
  const { purchases, isLoading } = useTicketPurchases(eventId);

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

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <Card key={purchase.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{purchase.buyer_name}</CardTitle>
              <div className="flex items-center gap-2">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
