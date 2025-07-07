
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/dateUtils";
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from "lucide-react";

export const RevenueAnalytics = () => {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-analytics'],
    queryFn: async () => {
      const { data: purchases, error } = await supabase
        .from('ticket_purchases')
        .select(`
          amount_paid,
          created_at,
          payment_method,
          payment_status,
          events (name, category)
        `)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process data for charts
      const dailyRevenue = purchases.reduce((acc: any, purchase) => {
        const date = new Date(purchase.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + Number(purchase.amount_paid);
        return acc;
      }, {});

      const revenueByMethod = purchases.reduce((acc: any, purchase) => {
        const method = purchase.payment_method || 'unknown';
        acc[method] = (acc[method] || 0) + Number(purchase.amount_paid);
        return acc;
      }, {});

      const revenueByCategory = purchases.reduce((acc: any, purchase) => {
        const category = purchase.events?.category || 'Unknown';
        acc[category] = (acc[category] || 0) + Number(purchase.amount_paid);
        return acc;
      }, {});

      return {
        dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({
          date,
          revenue: Number(revenue)
        })).slice(-30), // Last 30 days
        revenueByMethod: Object.entries(revenueByMethod).map(([method, amount]) => ({
          method,
          amount: Number(amount)
        })),
        revenueByCategory: Object.entries(revenueByCategory).map(([category, amount]) => ({
          category,
          amount: Number(amount)
        })),
        totalRevenue: purchases.reduce((sum, p) => sum + Number(p.amount_paid), 0),
        totalTransactions: purchases.length
      };
    },
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Revenue Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground flex items-center">
          <DollarSign className="w-6 h-6 mr-2" />
          Revenue Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(revenueData?.totalRevenue || 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{revenueData?.totalTransactions || 0}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Daily Revenue Trend */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Daily Revenue Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData?.dailyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Payment Method */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Revenue by Payment Method</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={revenueData?.revenueByMethod || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="amount"
                  nameKey="method"
                >
                  {revenueData?.revenueByMethod?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* By Category */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Revenue by Category</h3>
            <div className="space-y-2">
              {revenueData?.revenueByCategory?.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between p-2 bg-white/50 rounded">
                  <span className="font-medium">{item.category}</span>
                  <span className="text-green-600 font-semibold">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
