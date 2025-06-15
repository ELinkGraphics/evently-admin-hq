
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EventCustomField } from '@/types/event';

export const useEventCustomFields = (eventId?: string) => {
  return useQuery({
    queryKey: ['event_custom_fields', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('event_custom_fields')
        .select('*')
        .eq('event_id', eventId)
        .order('field_order', { ascending: true });
      if (error) throw error;
      return data as EventCustomField[];
    },
    enabled: !!eventId,
  });
};
