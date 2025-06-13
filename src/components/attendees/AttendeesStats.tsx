
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, User, Activity, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface StatsData {
  totalAttendees: number;
  checkedIn: number;
  todayCheckIns: number;
  weekAttendees: number;
  checkInRate: string;
}

export const AttendeesStats = () => {
  const queryClient = useQueryClient();

  // Fetch attendee statistics
  const { data: stats } = useQuery<StatsData>({
    queryKey: ['attendee_stats'],
    queryFn: async (): Promise<StatsData> => {
      // Get total attendees
      const { data: totalAttendees, error: totalError } = await supabase
        .from('ticket_purchases')
        .select('tickets_quantity');
      
      if (totalError) throw totalError;

      // Get checked-in attendees
      const { data: checkedInAttendees, error: checkedInError } = await supabase
        .from('ticket_purchases')
        .select('tickets_quantity')
        .eq('checked_in', true);
      
      if (checkedInError) throw checkedInError;

      // Get today's check-ins
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayCheckIns, error: todayError } = await supabase
        .from('ticket_purchases')
        .select('tickets_quantity')
        .eq('checked_in', true)
        .gte('check_in_time', today.toISOString());
      
      if (todayError) throw todayError;

      // Get this week's new attendees
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weekAttendees, error: weekError } = await supabase
        .from('ticket_purchases')
        .select('tickets_quantity')
        .gte('created_at', weekAgo.toISOString());
      
      if (weekError) throw weekError;

      const totalAttendeesCount = (totalAttendees || []).reduce((sum, purchase) => sum + purchase.tickets_quantity, 0);
      const checkedInCount = (checkedInAttendees || []).reduce((sum, purchase) => sum + purchase.tickets_quantity, 0);
      const todayCheckInsCount = (todayCheckIns || []).reduce((sum, purchase) => sum + purchase.tickets_quantity, 0);
      const weekAttendeesCount = (weekAttendees || []).reduce((sum, purchase) => sum + purchase.tickets_quantity, 0);

      return {
        totalAttendees: totalAttendeesCount,
        checkedIn: checkedInCount,
        todayCheckIns: todayCheckInsCount,
        weekAttendees: weekAttendeesCount,
        checkInRate: totalAttendeesCount > 0 ? ((checkedInCount / totalAttendeesCount) * 100).toFixed(1) : '0'
      };
    },
  });

  // Set up real-time subscription for stats
  useEffect(() => {
    const channelName = `attendee-stats-${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ticket_purchases' 
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['attendee_stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const kpis = [
    {
      title: "Total Attendees",
      value: stats?.totalAttendees?.toString() || "0",
      change: `+${stats?.weekAttendees || 0}`,
      trend: "up" as const,
      description: "This week",
      icon: User,
      color: "text-blue-600",
    },
    {
      title: "Checked In",
      value: stats?.checkedIn?.toString() || "0",
      change: `${stats?.checkInRate || 0}%`,
      trend: "up" as const,
      description: "Check-in rate",
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      title: "Today's Check-ins",
      value: stats?.todayCheckIns?.toString() || "0",
      change: "+new",
      trend: "up" as const,
      description: "Today",
      icon: Activity,
      color: "text-purple-600",
    },
    {
      title: "Attendance Rate",
      value: `${stats?.checkInRate || 0}%`,
      change: "+good",
      trend: "up" as const,
      description: "Overall",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => {
        const IconComponent = kpi.icon;
        return (
          <Card key={index} className="bg-white/60 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{kpi.value}</p>
                </div>
                <div className="flex flex-col items-end">
                  <IconComponent className={`w-8 h-8 ${kpi.color} mb-2`} />
                  <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>{kpi.change}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">{kpi.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
