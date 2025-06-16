
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

        const result = {
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
          }
        };

        console.log('KPI Data Result:', result);
        return result;
      } catch (error) {
        console.error('KPI Data Hook - Error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: 1000
  });
};
