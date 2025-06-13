
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, User, Activity, Download, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface AttendeesListProps {
  searchTerm: string;
  statusFilter: string;
  eventFilter: string;
}

interface AttendeeRecord {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  tickets_quantity: number;
  amount_paid: number;
  purchase_date: string;
  created_at: string;
  checked_in: boolean;
  check_in_time: string | null;
  event_id: string;
  events: {
    name: string;
    date: string;
    location: string;
  };
}

export const AttendeesList = ({ searchTerm, statusFilter, eventFilter }: AttendeesListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all attendees with event details
  const { data: attendees = [], isLoading } = useQuery({
    queryKey: ['attendees', searchTerm, statusFilter, eventFilter],
    queryFn: async () => {
      let query = supabase
        .from('ticket_purchases')
        .select(`
          *,
          events (
            name,
            date,
            location
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (eventFilter !== 'all') {
        query = query.eq('event_id', eventFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Filter by search term and status on the client side
      let filteredData = (data || []) as AttendeeRecord[];

      if (searchTerm) {
        filteredData = filteredData.filter(attendee =>
          attendee.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attendee.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (attendee.events?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filteredData = filteredData.filter(attendee => {
          if (statusFilter === 'checked_in') return attendee.checked_in;
          if (statusFilter === 'not_checked_in') return !attendee.checked_in;
          return true;
        });
      }

      return filteredData;
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ attendeeId, checkedIn }: { attendeeId: string; checkedIn: boolean }) => {
      const { data, error } = await supabase
        .from('ticket_purchases')
        .update({ 
          checked_in: checkedIn,
          check_in_time: checkedIn ? new Date().toISOString() : null
        })
        .eq('id', attendeeId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendees'] });
      queryClient.invalidateQueries({ queryKey: ['attendee_stats'] });
      toast({
        title: "Success",
        description: "Attendee check-in status updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update check-in status. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating check-in status:', error);
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channelName = `attendees-changes-${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ticket_purchases' 
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['attendees'] });
          queryClient.invalidateQueries({ queryKey: ['attendee_stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Export attendees
  const exportAttendees = () => {
    const csvData = attendees.map(attendee => ({
      Name: attendee.buyer_name,
      Email: attendee.buyer_email,
      Phone: attendee.buyer_phone || '',
      Event: attendee.events?.name || '',
      Tickets: attendee.tickets_quantity,
      Amount: attendee.amount_paid,
      'Purchase Date': new Date(attendee.purchase_date).toLocaleDateString(),
      'Checked In': attendee.checked_in ? 'Yes' : 'No',
      'Check-in Time': attendee.check_in_time ? new Date(attendee.check_in_time).toLocaleString() : ''
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-border">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-border">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-foreground">
            Attendees ({attendees.length})
          </CardTitle>
          <Button onClick={exportAttendees} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {attendees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No attendees found</p>
          </div>
        ) : (
          attendees.map((attendee) => (
            <div key={attendee.id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-border">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {attendee.buyer_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{attendee.buyer_name}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span>{attendee.buyer_email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="w-3 h-3" />
                      <span>{attendee.events?.name || 'Unknown Event'}</span>
                    </div>
                    <div>
                      <span>{attendee.tickets_quantity} ticket{attendee.tickets_quantity > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Purchased {formatDistanceToNow(new Date(attendee.purchase_date), { addSuffix: true })}
                    {attendee.checked_in && attendee.check_in_time && (
                      <span> • Checked in {formatDistanceToNow(new Date(attendee.check_in_time), { addSuffix: true })}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge 
                  variant={attendee.checked_in ? "default" : "secondary"}
                  className={attendee.checked_in ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {attendee.checked_in ? "Checked In" : "Not Checked In"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkInMutation.mutate({ 
                    attendeeId: attendee.id, 
                    checkedIn: !attendee.checked_in 
                  })}
                  disabled={checkInMutation.isPending}
                  className={attendee.checked_in ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                >
                  {attendee.checked_in ? (
                    <XCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  )}
                  {attendee.checked_in ? "Check Out" : "Check In"}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
