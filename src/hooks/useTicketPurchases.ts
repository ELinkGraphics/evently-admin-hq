
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TicketPurchase } from '@/types/event';
import { useToast } from '@/hooks/use-toast';

export const useTicketPurchases = (eventId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ticket purchases for a specific event
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['ticket_purchases', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('ticket_purchases')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TicketPurchase[];
    },
    enabled: !!eventId,
  });

  // Create ticket purchase mutation
  const createPurchaseMutation = useMutation({
    mutationFn: async (purchaseData: Omit<TicketPurchase, 'id' | 'created_at' | 'updated_at' | 'purchase_date'>) => {
      const { data, error } = await supabase
        .from('ticket_purchases')
        .insert([purchaseData])
        .select()
        .single();
      
      if (error) throw error;
      return data as TicketPurchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket_purchases'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Tickets purchased successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to purchase tickets. Please try again.",
        variant: "destructive",
      });
      console.error('Error purchasing tickets:', error);
    },
  });

  return {
    purchases,
    isLoading,
    createPurchase: createPurchaseMutation.mutate,
    isCreating: createPurchaseMutation.isPending,
  };
};
