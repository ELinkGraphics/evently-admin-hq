
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";

export const SalesChart = () => {
  const { data: salesData = [], isLoading, error } = useQuery({
    queryKey: ['sales-chart-data'],
    queryFn: async () => {
      const { data: purchases, error } = await supabase
        .from('ticket_purchases')
        .select('amount_paid, created_at')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month and sum revenue
      const monthlyData: Record<string, number> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      purchases.forEach((purchase) => {
        const date = new Date(purchase.created_at);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(purchase.amount_paid);
      });

      // Convert to chart format and take last 12 months
      return Object.entries(monthlyData)
        .map(([month, sales]) => ({ name: month, sales }))
        .slice(-12);
    },
  });

  if (error) {
    console.error('Error loading sales chart data:', error);
  }
  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Unable to load sales data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Sales Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.9)", 
                border: "1px solid #e0e7ff",
                borderRadius: "8px"
              }}
              formatter={(value) => [formatCurrency(Number(value)), 'Sales']}
            />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="url(#gradient)" 
              strokeWidth={3}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
