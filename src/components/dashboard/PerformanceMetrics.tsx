
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Target, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const PerformanceMetrics = () => {
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const [eventsResult, purchasesResult] = await Promise.all([
        supabase.from('events').select('*'),
        supabase.from('ticket_purchases').select('*').eq('payment_status', 'completed')
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (purchasesResult.error) throw purchasesResult.error;

      const events = eventsResult.data;
      const purchases = purchasesResult.data;

      // Calculate metrics
      const totalEvents = events.length;
      const activeEvents = events.filter(e => e.status === 'Active').length;
      const completedEvents = events.filter(e => e.status === 'Completed').length;
      const draftEvents = events.filter(e => e.status === 'Draft').length;

      // Calculate average capacity utilization
      const capacityUtilization = events.length > 0 
        ? events.reduce((sum, event) => {
            const utilization = event.capacity > 0 ? (event.tickets_sold || 0) / event.capacity : 0;
            return sum + utilization;
          }, 0) / events.length * 100
        : 0;

      // Calculate conversion rate (published events / total events)
      const conversionRate = totalEvents > 0 ? (activeEvents + completedEvents) / totalEvents * 100 : 0;

      // Calculate average tickets per event
      const avgTicketsPerEvent = totalEvents > 0 
        ? events.reduce((sum, event) => sum + (event.tickets_sold || 0), 0) / totalEvents
        : 0;

      // Revenue per event
      const avgRevenuePerEvent = totalEvents > 0
        ? events.reduce((sum, event) => sum + (event.revenue || 0), 0) / totalEvents
        : 0;

      // Recent performance (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentPurchases = purchases.filter(p => 
        new Date(p.created_at) > sevenDaysAgo
      );
      
      const recentRevenue = recentPurchases.reduce((sum, p) => sum + Number(p.amount_paid), 0);

      return {
        totalEvents,
        activeEvents,
        completedEvents,
        draftEvents,
        capacityUtilization,
        conversionRate,
        avgTicketsPerEvent,
        avgRevenuePerEvent,
        recentRevenue,
        recentPurchases: recentPurchases.length
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 80) return { level: 'Excellent', color: 'bg-green-500' };
    if (percentage >= 60) return { level: 'Good', color: 'bg-blue-500' };
    if (percentage >= 40) return { level: 'Fair', color: 'bg-yellow-500' };
    return { level: 'Needs Improvement', color: 'bg-red-500' };
  };

  const capacityPerf = getPerformanceLevel(metricsData?.capacityUtilization || 0);
  const conversionPerf = getPerformanceLevel(metricsData?.conversionRate || 0);

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground flex items-center">
          <Target className="w-6 h-6 mr-2" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold text-blue-600">{metricsData?.totalEvents || 0}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Events</p>
                <p className="text-2xl font-bold text-green-600">{metricsData?.activeEvents || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Revenue/Event</p>
                <p className="text-2xl font-bold text-purple-600">${(metricsData?.avgRevenuePerEvent || 0).toFixed(0)}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Revenue (7d)</p>
                <p className="text-2xl font-bold text-orange-600">${(metricsData?.recentRevenue || 0).toFixed(0)}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Performance Indicators</h3>
          
          {/* Capacity Utilization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Capacity Utilization</span>
              <div className="flex items-center gap-2">
                <Badge className={`${capacityPerf.color} text-white`}>
                  {capacityPerf.level}
                </Badge>
                <span className="text-sm font-bold">{(metricsData?.capacityUtilization || 0).toFixed(1)}%</span>
              </div>
            </div>
            <Progress value={metricsData?.capacityUtilization || 0} className="h-2" />
          </div>

          {/* Event Conversion Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Event Conversion Rate</span>
              <div className="flex items-center gap-2">
                <Badge className={`${conversionPerf.color} text-white`}>
                  {conversionPerf.level}
                </Badge>
                <span className="text-sm font-bold">{(metricsData?.conversionRate || 0).toFixed(1)}%</span>
              </div>
            </div>
            <Progress value={metricsData?.conversionRate || 0} className="h-2" />
          </div>

          {/* Average Tickets per Event */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg Tickets per Event</span>
              <span className="text-sm font-bold">{(metricsData?.avgTicketsPerEvent || 0).toFixed(1)}</span>
            </div>
            <Progress value={Math.min((metricsData?.avgTicketsPerEvent || 0) * 10, 100)} className="h-2" />
          </div>
        </div>

        {/* Event Status Breakdown */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Event Status Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border">
              <p className="text-2xl font-bold text-green-600">{metricsData?.activeEvents || 0}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border">
              <p className="text-2xl font-bold text-blue-600">{metricsData?.completedEvents || 0}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg border">
              <p className="text-2xl font-bold text-gray-600">{metricsData?.draftEvents || 0}</p>
              <p className="text-sm text-muted-foreground">Draft</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
