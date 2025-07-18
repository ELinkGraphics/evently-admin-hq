
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event, CreateEventData } from '@/types/event';
import { useToast } from '@/hooks/use-toast';

export const useEvents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all events
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Event[];
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventData) => {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();
      
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating event:', error);
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: Partial<Event> & { id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating event:', error);
    },
  });

  // Publish event mutation
  const publishEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
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
      
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event published successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to publish event. Please try again.",
        variant: "destructive",
      });
      console.error('Error publishing event:', error);
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting event:', error);
    },
  });

  // Set up real-time subscription with proper cleanup
  useEffect(() => {
    const channelName = `events-changes-${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'events' 
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
