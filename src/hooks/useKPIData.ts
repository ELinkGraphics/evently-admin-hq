
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TimePeriod, getDateRange, getPreviousDateRange, calculatePercentageChange } from "@/lib/dateUtils";

export const useKPIData = (period: TimePeriod = 'month') => {
  const { startDate, endDate } = getDateRange(period);
  const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousDateRange(period);

  return useQuery({
    queryKey: ['kpi-data', period, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // Current period data
      const { data: currentPurchases, error: currentError } = await supabase
        .from('ticket_purchases')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('payment_status', 'completed');

      if (currentError) throw currentError;

      // Previous period data
      const { data: previousPurchases, error: previousError } = await supabase
        .from('ticket_purchases')
        .select('*')
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString())
        .eq('payment_status', 'completed');

      if (previousError) throw previousError;

      // Events data
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*');

      if (eventsError) throw eventsError;

      // Calculate current period metrics
      const currentRevenue = currentPurchases?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
      const currentTicketsSold = currentPurchases?.reduce((sum, p) => sum + p.tickets_quantity, 0) || 0;
      const currentTransactions = currentPurchases?.length || 0;

      // Calculate previous period metrics
      const previousRevenue = previousPurchases?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
      const previousTicketsSold = previousPurchases?.reduce((sum, p) => sum + p.tickets_quantity, 0) || 0;
      const previousTransactions = previousPurchases?.length || 0;

      // Calculate averages and other metrics
      const avgTicketPrice = currentTicketsSold > 0 ? currentRevenue / currentTicketsSold : 0;
      const previousAvgTicketPrice = previousTicketsSold > 0 ? previousRevenue / previousTicketsSold : 0;

      // Active events
      const activeEvents = events?.filter(e => 
        e.status === 'Active' && new Date(e.date) > new Date()
      ).length || 0;

      // Calculate percentage changes
      const revenueChange = calculatePercentageChange(currentRevenue, previousRevenue);
      const ticketsChange = calculatePercentageChange(currentTicketsSold, previousTicketsSold);
      const avgPriceChange = calculatePercentageChange(avgTicketPrice, previousAvgTicketPrice);
      const transactionsChange = calculatePercentageChange(currentTransactions, previousTransactions);

      return {
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          change: revenueChange
        },
        ticketsSold: {
          current: currentTicketsSold,
          previous: previousTicketsSold,
          change: ticketsChange
        },
        averageTicketPrice: {
          current: avgTicketPrice,
          previous: previousAvgTicketPrice,
          change: avgPriceChange
        },
        transactions: {
          current: currentTransactions,
          previous: previousTransactions,
          change: transactionsChange
        },
        activeEvents
      };
    },
  });
};
