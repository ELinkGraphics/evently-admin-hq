
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEvents } from "@/hooks/useEvents";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import { ActivityFilters } from "./ActivityFilters";
import { Eye, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const EnhancedRecentActivity = () => {
  const { events } = useEvents();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Set up real-time subscription for recent purchases
  useEffect(() => {
    console.log('[EnhancedRecentActivity] Setting up real-time subscription');
    
    const channel = supabase
      .channel('enhanced-activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_purchases',
        },
        (payload) => {
          console.log('[EnhancedRecentActivity] Real-time update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['recent_purchases'] });
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .subscribe();

    return () => {
      console.log('[EnhancedRecentActivity] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch recent ticket purchases
  const { data: recentPurchases = [], refetch, isLoading } = useQuery({
    queryKey: ['recent_purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_purchases')
        .select(`
          *,
          events (name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
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
    .slice(0, 10);

  const activities = [
    ...recentPurchases.map(purchase => {
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
        purchaseId: purchase.id,
        eventId: purchase.event_id,
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
      purchaseId: null,
      eventId: event.id,
    }))
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 15);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (selectedType !== 'all' && activity.type !== selectedType) return false;
    if (selectedStatus !== 'all' && activity.status !== selectedStatus) return false;
    return true;
  });

  const handleClearFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Activity feed has been updated",
    });
  };

  const handleViewDetails = (activityId: string) => {
    toast({
      title: "View Details",
      description: `Detailed view for activity ${activityId} coming soon!`,
    });
  };

  const handleExport = () => {
    toast({
      title: "Export",
      description: "Activity export feature coming soon!",
    });
  };

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground">Recent Activity</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <ActivityFilters
          selectedType={selectedType}
          selectedStatus={selectedStatus}
          onTypeChange={setSelectedType}
          onStatusChange={setSelectedStatus}
          onClearFilters={handleClearFilters}
        />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No activities match your filters</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg border border-border hover:bg-white/70 transition-colors">
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
                  <Badge variant="outline" className="text-xs capitalize">
                    {activity.type}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activity.amount && (
                  <div className="text-sm font-semibold text-green-600">
                    {activity.amount}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetails(activity.id)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
