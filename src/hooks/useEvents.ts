
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event, CreateEventData } from '@/types/event';
import { useToast } from '@/hooks/use-toast';

export const useEvents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all events with better error handling
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching events:', error);
          throw error;
        }
        
        // Ensure data is properly typed and has default values
        return (data || []).map(event => ({
          ...event,
          tickets_sold: event.tickets_sold || 0,
          revenue: event.revenue || 0,
          attendees: event.attendees || 0,
          price: event.price || 0,
          capacity: event.capacity || 0,
        })) as Event[];
      } catch (err) {
        console.error('Query error:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Create event mutation with validation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventData) => {
      try {
        // Validate required fields
        if (!eventData.name || !eventData.date || !eventData.location || !eventData.capacity) {
          throw new Error('Missing required fields');
        }

        const { data, error } = await supabase
          .from('events')
          .insert([{
            ...eventData,
            tickets_sold: 0,
            revenue: 0,
            attendees: 0,
            status: 'Draft',
            is_published: false,
          }])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating event:', error);
          throw error;
        }
        return data as Event;
      } catch (err) {
        console.error('Create event error:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: `Event "${data.name}" created successfully!`,
      });
    },
    onError: (error: any) => {
      console.error('Create event mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update event mutation with validation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: Partial<Event> & { id: string }) => {
      try {
        if (!id) {
          throw new Error('Event ID is required');
        }

        const { data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating event:', error);
          throw error;
        }
        return data as Event;
      } catch (err) {
        console.error('Update event error:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: `Event "${data.name}" updated successfully!`,
      });
    },
    onError: (error: any) => {
      console.error('Update event mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Publish event mutation with better validation
  const publishEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      try {
        if (!eventId) {
          throw new Error('Event ID is required');
        }

        const publicLink = `${window.location.origin}/event/${eventId}`;
        const { data, error } = await supabase
          .from('events')
          .update({ 
            is_published: true, 
            status: 'Active',
            public_link: publicLink 
          })
          .eq('id', eventId)
          .select()
          .single();
        
        if (error) {
          console.error('Error publishing event:', error);
          throw error;
        }
        return data as Event;
      } catch (err) {
        console.error('Publish event error:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: `Event "${data.name}" published successfully!`,
      });
    },
    onError: (error: any) => {
      console.error('Publish event mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to publish event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete event mutation with confirmation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        if (!id) {
          throw new Error('Event ID is required');
        }

        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting event:', error);
          throw error;
        }
      } catch (err) {
        console.error('Delete event error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event deleted successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Delete event mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set up real-time subscription with better error handling
  useEffect(() => {
    const channelName = `events-changes-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'events' 
          },
          (payload) => {
            console.log('Real-time event update:', payload);
            queryClient.invalidateQueries({ queryKey: ['events'] });
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('Real-time subscription error:', err);
    }
  }, [queryClient]);

  return {
    events,
    isLoading,
    error,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    publishEvent: publishEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isPublishing: publishEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
  };
};
