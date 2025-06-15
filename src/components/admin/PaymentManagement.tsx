
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, Search, Filter, DollarSign, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';

export const PaymentManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifying, setVerifying] = useState<string | null>(null);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('payment-management-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_purchases',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all_ticket_purchases'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch all ticket purchases
  const { data: purchases = [], isLoading, refetch } = useQuery({
    queryKey: ['all_ticket_purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_purchases')
        .select(`
          *,
          events (name, date)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Filter purchases based on search and status
  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.buyer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.events?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.chapa_tx_ref?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || purchase.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleManualVerification = async (txRef: string, purchaseId: string) => {
    setVerifying(purchaseId);
    try {
      const { data, error } = await supabase.functions.invoke('verify-chapa-payment', {
        body: { tx_ref: txRef, status: 'manual' }
      });

      if (error) throw error;

      if (data?.verified) {
        toast({
          title: "Payment Verified",
          description: "Payment has been successfully verified and updated.",
        });
      } else {
        toast({
          title: "Verification Failed", 
          description: "Payment could not be verified with Chapa.",
          variant: "destructive"
        });
      }
      
      // Refresh the data
      refetch();
    } catch (error) {
      console.error('Manual verification failed:', error);
      toast({
        title: "Error",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setVerifying(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate summary stats
  const totalRevenue = purchases
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + p.amount_paid, 0);
  
  const pendingAmount = purchases
    .filter(p => p.payment_status === 'pending')
    .reduce((sum, p) => sum + p.amount_paid, 0);

  const statusCounts = purchases.reduce((acc, purchase) => {
    acc[purchase.payment_status] = (acc[purchase.payment_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{statusCounts.completed || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{statusCounts.failed || 0}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Payment Management
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, event, or transaction ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{purchase.buyer_name}</p>
                        <p className="text-sm text-muted-foreground">{purchase.buyer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{purchase.events?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {purchase.tickets_quantity} ticket{purchase.tickets_quantity > 1 ? 's' : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(purchase.amount_paid)}</TableCell>
                    <TableCell>{getStatusBadge(purchase.payment_status)}</TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDistanceToNow(new Date(purchase.created_at), { addSuffix: true })}</p>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {purchase.chapa_tx_ref && (
                          <p>Ref: {purchase.chapa_tx_ref}</p>
                        )}
                        {purchase.chapa_transaction_id && (
                          <p>ID: {purchase.chapa_transaction_id}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {purchase.payment_status === 'pending' && purchase.chapa_tx_ref && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleManualVerification(purchase.chapa_tx_ref!, purchase.id)}
                          disabled={verifying === purchase.id}
                        >
                          {verifying === purchase.id ? 'Verifying...' : 'Verify'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPurchases.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4" />
              <p>No payments found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
