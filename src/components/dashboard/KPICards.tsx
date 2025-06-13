
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const KPICards = () => {
  const { events } = useEvents();

  // Fetch ticket purchases for revenue calculation
  const { data: ticketPurchases = [] } = useQuery({
    queryKey: ['all_ticket_purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_purchases')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate real-time KPIs
  const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0);
  const totalTicketsSold = events.reduce((sum, event) => sum + (event.tickets_sold || 0), 0);
  const upcomingEvents = events.filter(event => 
    new Date(event.date) > new Date() && event.status === 'Active'
  ).length;
  const thisWeekPurchases = ticketPurchases.filter(purchase => {
    const purchaseDate = new Date(purchase.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return purchaseDate > weekAgo;
  }).length;

  const kpis = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      change: "+12.5%",
      trend: "up" as const,
      description: "All time",
    },
    {
      title: "Tickets Sold",
      value: totalTicketsSold.toLocaleString(),
      change: "+8.2%",
      trend: "up" as const,
      description: "All time",
    },
    {
      title: "Upcoming Events",
      value: upcomingEvents.toString(),
      change: "+3",
      trend: "up" as const,
      description: "Active events",
    },
    {
      title: "New Purchases",
      value: thisWeekPurchases.toString(),
      change: "+15%",
      trend: "up" as const,
      description: "This week",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <Card key={index} className="bg-white/60 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{kpi.value}</p>
              </div>
              <div className={`flex items-center space-x-1 text-sm font-medium ${
                kpi.trend === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {kpi.trend === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{kpi.change}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
