
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TimePeriod, getDateRange, getPreviousDateRange, calculatePercentageChange } from "@/lib/dateUtils";

export const useKPIData = (period: TimePeriod = 'month') => {
  const { startDate, endDate } = getDateRange(period);
  const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousDateRange(period);

  console.log('KPI Data Hook - Period:', period);
  console.log('KPI Data Hook - Current Range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });
  console.log('KPI Data Hook - Previous Range:', { prevStartDate: prevStartDate.toISOString(), prevEndDate: prevEndDate.toISOString() });

  return useQuery({
    queryKey: ['kpi-data', period, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      console.log('KPI Data Hook - Starting data fetch...');
      
      try {
        // Fetch all events data for comprehensive metrics
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*');

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          throw eventsError;
        }

        console.log('Events data:', eventsData?.length || 0, 'records');

        // Current period data
        console.log('Fetching current period purchases...');
        const { data: currentPurchases, error: currentError } = await supabase
          .from('ticket_purchases')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .eq('payment_status', 'completed');

        if (currentError) {
          console.error('Error fetching current purchases:', currentError);
          throw currentError;
        }

        console.log('Current purchases:', currentPurchases?.length || 0, 'records');

        // Previous period data
        console.log('Fetching previous period purchases...');
        const { data: previousPurchases, error: previousError } = await supabase
          .from('ticket_purchases')
          .select('*')
          .gte('created_at', prevStartDate.toISOString())
          .lte('created_at', prevEndDate.toISOString())
          .eq('payment_status', 'completed');

        if (previousError) {
          console.error('Error fetching previous purchases:', previousError);
          throw previousError;
        }

        console.log('Previous purchases:', previousPurchases?.length || 0, 'records');

        // Calculate current period metrics
        const currentRevenue = currentPurchases?.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0) || 0;
        const currentTicketsSold = currentPurchases?.reduce((sum, p) => sum + (p.tickets_quantity || 0), 0) || 0;
        const currentTransactions = currentPurchases?.length || 0;

        // Calculate previous period metrics
        const previousRevenue = previousPurchases?.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0) || 0;
        const previousTicketsSold = previousPurchases?.reduce((sum, p) => sum + (p.tickets_quantity || 0), 0) || 0;
        const previousTransactions = previousPurchases?.length || 0;

        // Calculate averages
        const avgTicketPrice = currentTicketsSold > 0 ? currentRevenue / currentTicketsSold : 0;
        const previousAvgTicketPrice = previousTicketsSold > 0 ? previousRevenue / previousTicketsSold : 0;

        // Calculate percentage changes
        const revenueChange = calculatePercentageChange(currentRevenue, previousRevenue);
        const ticketsChange = calculatePercentageChange(currentTicketsSold, previousTicketsSold);
        const avgPriceChange = calculatePercentageChange(avgTicketPrice, previousAvgTicketPrice);
        const transactionsChange = calculatePercentageChange(currentTransactions, previousTransactions);

        // Calculate additional useful metrics from events data
        const totalEvents = eventsData?.length || 0;
        const activeEvents = eventsData?.filter(e => e.status === 'Active').length || 0;
        const publishedEvents = eventsData?.filter(e => e.is_published).length || 0;
        const totalCapacity = eventsData?.reduce((sum, e) => sum + (e.capacity || 0), 0) || 0;
        const totalEventRevenue = eventsData?.reduce((sum, e) => sum + (e.revenue || 0), 0) || 0;
        const totalEventTicketsSold = eventsData?.reduce((sum, e) => sum + (e.tickets_sold || 0), 0) || 0;

        // If no recent transactions, use total event data as fallback
        const displayRevenue = currentRevenue > 0 ? currentRevenue : totalEventRevenue;
        const displayTicketsSold = currentTicketsSold > 0 ? currentTicketsSold : totalEventTicketsSold;
        const displayTransactions = currentTransactions > 0 ? currentTransactions : totalEvents;
        const displayAvgTicketPrice = displayTicketsSold > 0 ? displayRevenue / displayTicketsSold : 
          (eventsData?.length > 0 ? eventsData.reduce((sum, e) => sum + (e.price || 0), 0) / eventsData.length : 0);

        const result = {
          revenue: {
            current: displayRevenue,
            previous: previousRevenue,
            change: revenueChange
          },
          ticketsSold: {
            current: displayTicketsSold,
            previous: previousTicketsSold,
            change: ticketsChange
          },
          averageTicketPrice: {
            current: displayAvgTicketPrice,
            previous: previousAvgTicketPrice,
            change: avgPriceChange
          },
          transactions: {
            current: displayTransactions,
            previous: previousTransactions,
            change: transactionsChange
          },
          // Additional metrics for better insights
          totalEvents,
          activeEvents,
          publishedEvents,
          capacityUtilization: totalCapacity > 0 ? (totalEventTicketsSold / totalCapacity) * 100 : 0
        };

        console.log('KPI Data Result:', result);
        return result;
      } catch (error) {
        console.error('KPI Data Hook - Error:', error);
        // Return fallback data instead of throwing
        return {
          revenue: { current: 0, previous: 0, change: 0 },
          ticketsSold: { current: 0, previous: 0, change: 0 },
          averageTicketPrice: { current: 0, previous: 0, change: 0 },
          transactions: { current: 0, previous: 0, change: 0 },
          totalEvents: 0,
          activeEvents: 0,
          publishedEvents: 0,
          capacityUtilization: 0
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  });
};
