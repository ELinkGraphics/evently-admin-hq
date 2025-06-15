
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEvents } from "@/hooks/useEvents";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";

export const RecentActivity = () => {
  const { events } = useEvents();
  const queryClient = useQueryClient();

  // Set up real-time subscription for recent purchases
  useEffect(() => {
    console.log('[RecentActivity] Setting up real-time subscription');
    
    const channel = supabase
      .channel('recent-activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_purchases',
        },
        (payload) => {
          console.log('[RecentActivity] Real-time update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['recent_purchases'] });
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .subscribe();

    return () => {
      console.log('[RecentActivity] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch recent ticket purchases
  const { data: recentPurchases = [] } = useQuery({
    queryKey: ['recent_purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_purchases')
        .select(`
          *,
          events (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  // Combine purchases and recent events for activity feed
  const recentEvents = events
    .filter(event => {
      const eventDate = new Date(event.created_at);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return eventDate > threeDaysAgo;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const activities = [
    ...recentPurchases.map(purchase => {
      // Fallback: Use buyer_name if present, else use first/last name, else "?"
      let user =
        purchase.buyer_name ||
        ((purchase.first_name || "") + (purchase.last_name ? ` ${purchase.last_name}` : "")) ||
        "?";
      user = user.trim() || "?";

      return {
        id: `purchase-${purchase.id}`,
        type: "purchase" as const,
        user,
        action: `purchased ${purchase.tickets_quantity} ticket${purchase.tickets_quantity > 1 ? 's' : ''} for ${purchase.events?.name || 'Unknown Event'}`,
        time: formatDistanceToNow(new Date(purchase.created_at), { addSuffix: true }),
        amount: `$${purchase.amount_paid}`,
        status: purchase.payment_status,
        timestamp: new Date(purchase.created_at).getTime(),
      };
    }),
    ...recentEvents.map(event => ({
      id: `event-${event.id}`,
      type: "event" as const,
      user: "Admin",
      action: `created new event "${event.name}"`,
      time: formatDistanceToNow(new Date(event.created_at), { addSuffix: true }),
      amount: null,
      status: null,
      timestamp: new Date(event.created_at).getTime(),
    }))
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg border border-border">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {activity.user && typeof activity.user === "string" && activity.user.trim().length > 0
                    ? activity.user.trim().charAt(0).toUpperCase()
                    : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  <span className="font-semibold">{activity.user}</span> {activity.action}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                  {activity.status && getStatusBadge(activity.status)}
                </div>
              </div>
              {activity.amount && (
                <div className="text-sm font-semibold text-green-600">
                  {activity.amount}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
