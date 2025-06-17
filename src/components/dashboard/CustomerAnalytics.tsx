
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Repeat, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const CustomerAnalytics = () => {
  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: async () => {
      const { data: purchases, error } = await supabase
        .from('ticket_purchases')
        .select(`
          buyer_email,
          buyer_name,
          tickets_quantity,
          amount_paid,
          created_at,
          payment_status,
          events (name, category)
        `)
        .eq('payment_status', 'completed');

      if (error) throw error;

      // Process customer data
      const customerMap = purchases.reduce((acc: any, purchase) => {
        const email = purchase.buyer_email;
        if (!acc[email]) {
          acc[email] = {
            email,
            name: purchase.buyer_name || 'Unknown',
            totalSpent: 0,
            totalTickets: 0,
            eventCount: 0,
            events: new Set(),
            firstPurchase: purchase.created_at,
            lastPurchase: purchase.created_at
          };
        }
        
        // Ensure numeric conversion for arithmetic operations
        const amountPaid = Number(purchase.amount_paid) || 0;
        const ticketsQuantity = Number(purchase.tickets_quantity) || 0;
        
        acc[email].totalSpent += amountPaid;
        acc[email].totalTickets += ticketsQuantity;
        acc[email].events.add(purchase.events?.name);
        acc[email].eventCount = acc[email].events.size;
        
        if (new Date(purchase.created_at) < new Date(acc[email].firstPurchase)) {
          acc[email].firstPurchase = purchase.created_at;
        }
        if (new Date(purchase.created_at) > new Date(acc[email].lastPurchase)) {
          acc[email].lastPurchase = purchase.created_at;
        }
        
        return acc;
      }, {});

      const customers = Object.values(customerMap);
      
      // Customer segments
      const segments = {
        new: customers.filter((c: any) => c.eventCount === 1).length,
        returning: customers.filter((c: any) => c.eventCount > 1 && c.eventCount <= 3).length,
        loyal: customers.filter((c: any) => c.eventCount > 3).length
      };

      // Top customers
      const topCustomers = customers
        .sort((a: any, b: any) => Number(b.totalSpent) - Number(a.totalSpent))
        .slice(0, 10);

      // Purchase frequency data
      const frequencyData = [
        { range: '1 event', count: segments.new },
        { range: '2-3 events', count: segments.returning },
        { range: '4+ events', count: segments.loyal }
      ];

      // Calculate averages with proper type conversion
      const totalSpentSum = customers.reduce((sum: number, c: any) => sum + (Number(c.totalSpent) || 0), 0);
      const totalTicketsSum = customers.reduce((sum: number, c: any) => sum + (Number(c.totalTickets) || 0), 0);

      return {
        totalCustomers: customers.length,
        segments,
        topCustomers,
        frequencyData,
        averageSpending: customers.length > 0 ? totalSpentSum / customers.length : 0,
        averageTicketsPerCustomer: customers.length > 0 ? totalTicketsSum / customers.length : 0
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Customer Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'returning': return 'bg-yellow-100 text-yellow-800';
      case 'loyal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground flex items-center">
          <Users className="w-6 h-6 mr-2" />
          Customer Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold text-blue-600">{customerData?.totalCustomers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Spending</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(customerData?.averageSpending || 0).toFixed(0)}
                </p>
              </div>
              <Award className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Tickets</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(customerData?.averageTicketsPerCustomer || 0).toFixed(1)}
                </p>
              </div>
              <Repeat className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Loyal Customers</p>
                <p className="text-2xl font-bold text-orange-600">{customerData?.segments.loyal || 0}</p>
              </div>
              <UserPlus className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Customer Segments */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
          <div className="flex gap-4">
            <Badge className={getSegmentColor('new')}>
              New: {customerData?.segments.new || 0}
            </Badge>
            <Badge className={getSegmentColor('returning')}>
              Returning: {customerData?.segments.returning || 0}
            </Badge>
            <Badge className={getSegmentColor('loyal')}>
              Loyal: {customerData?.segments.loyal || 0}
            </Badge>
          </div>
        </div>

        {/* Purchase Frequency Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Purchase Frequency Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={customerData?.frequencyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Top Customers by Spending</h3>
          <div className="space-y-2">
            {customerData?.topCustomers?.slice(0, 5).map((customer: any, index: number) => (
              <div key={customer.email} className="flex items-center justify-between p-3 bg-white/50 rounded border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">${Number(customer.totalSpent || 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{customer.eventCount} events</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
