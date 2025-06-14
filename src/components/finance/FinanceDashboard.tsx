
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvents } from "@/hooks/useEvents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const FinanceDashboard = () => {
  const { events } = useEvents();

  // Fetch all ticket purchases for analytics
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['all_ticket_purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_purchases')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // KPI calculations
  const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0);
  const totalTicketsSold = events.reduce((sum, event) => sum + (event.tickets_sold || 0), 0);

  // Revenue trend data (month over month)
  const revenueByMonth: { month: string; revenue: number }[] = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revenueByMonthMap: Record<string, number> = {};
  purchases.forEach((purchase: any) => {
    const date = new Date(purchase.purchase_date);
    const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
    revenueByMonthMap[key] = (revenueByMonthMap[key] || 0) + Number(purchase.amount_paid || 0);
  });
  Object.entries(revenueByMonthMap).forEach(([month, revenue]) => {
    revenueByMonth.push({ month, revenue });
  });
  // Sort by date (basic string format: MMM YYYY)
  revenueByMonth.sort((a, b) =>
    new Date("1 " + a.month).getTime() - new Date("1 " + b.month).getTime()
  );

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/60 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tickets Sold</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {totalTicketsSold.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Revenue Trend Chart */}
      <Card className="bg-white/60 backdrop-blur-sm border-border mt-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                tick={{ fontSize: 14, fill: "#6b7280" }}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{
                backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e0e7ff", borderRadius: "8px"
              }} />
              <Line type="monotone" dataKey="revenue" stroke="url(#gradient2)" strokeWidth={3} dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }} />
              <defs>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      {/* Placeholder for future financial features*/}
      <div className="mt-6">
        <Card className="bg-white/70 border-dashed border-2 border-blue-200 text-blue-700 text-center">
          <CardContent className="p-6">
            <div className="text-lg font-semibold">Coming soon: payment management, budgets, reports & more.</div>
            <div className="text-sm text-muted-foreground mt-2">
              Stay tuned for budget planning, financial statements, refunds, notifications, and accounting integrations!
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
