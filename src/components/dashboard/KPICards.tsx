
import { useState } from "react";
import { DollarSign, Ticket, TrendingUp, ShoppingCart, Calendar, Users, Target, Activity } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { TimePeriod } from "@/lib/dateUtils";
import { PeriodSelector } from "./PeriodSelector";
import { EnhancedKPICard } from "./EnhancedKPICard";
import { useToast } from "@/hooks/use-toast";

export const KPICards = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const { data: kpiData, isLoading, error } = useKPIData(selectedPeriod);
  const { toast } = useToast();

  console.log('KPICards - Loading:', isLoading, 'Error:', error, 'Data:', kpiData);

  const handleCardClick = (cardType: string) => {
    toast({
      title: "Drill Down",
      description: `Detailed ${cardType} analytics coming soon!`,
    });
  };

  // Handle error state
  if (error) {
    console.error('Error loading KPI data:', error);
    toast({
      title: "Error",
      description: "Failed to load KPI data. Please refresh the page.",
      variant: "destructive",
    });
  }

  // Primary KPI cards with fallback data
  const primaryKpis = [
    {
      title: "Total Revenue",
      data: kpiData?.revenue || { current: 0, previous: 0, change: 0 },
      icon: <DollarSign className="w-6 h-6" />,
      format: 'currency' as const,
      description: kpiData?.revenue?.current > 0 ? `vs. previous ${selectedPeriod}` : 'All time total',
      onClick: () => handleCardClick('revenue')
    },
    {
      title: "Tickets Sold",
      data: kpiData?.ticketsSold || { current: 0, previous: 0, change: 0 },
      icon: <Ticket className="w-6 h-6" />,
      format: 'number' as const,
      description: kpiData?.ticketsSold?.current > 0 ? `vs. previous ${selectedPeriod}` : 'All time total',
      onClick: () => handleCardClick('tickets')
    },
    {
      title: "Avg Ticket Price",
      data: kpiData?.averageTicketPrice || { current: 0, previous: 0, change: 0 },
      icon: <TrendingUp className="w-6 h-6" />,
      format: 'currency' as const,
      description: kpiData?.averageTicketPrice?.current > 0 ? `vs. previous ${selectedPeriod}` : 'Average price',
      onClick: () => handleCardClick('pricing')
    },
    {
      title: "Events/Transactions",
      data: kpiData?.transactions || { current: 0, previous: 0, change: 0 },
      icon: <ShoppingCart className="w-6 h-6" />,
      format: 'number' as const,
      description: kpiData?.transactions?.current > 0 ? `vs. previous ${selectedPeriod}` : 'Total events',
      onClick: () => handleCardClick('transactions')
    },
  ];

  // Additional insight cards
  const insightKpis = [
    {
      title: "Total Events",
      data: { current: kpiData?.totalEvents || 0, previous: 0, change: 0 },
      icon: <Calendar className="w-6 h-6" />,
      format: 'number' as const,
      description: 'All events created',
      onClick: () => handleCardClick('events')
    },
    {
      title: "Active Events",
      data: { current: kpiData?.activeEvents || 0, previous: 0, change: 0 },
      icon: <Activity className="w-6 h-6" />,
      format: 'number' as const,
      description: 'Currently active',
      onClick: () => handleCardClick('active-events')
    },
    {
      title: "Published Events",
      data: { current: kpiData?.publishedEvents || 0, previous: 0, change: 0 },
      icon: <Users className="w-6 h-6" />,
      format: 'number' as const,
      description: 'Available to public',
      onClick: () => handleCardClick('published-events')
    },
    {
      title: "Capacity Utilization",
      data: { current: kpiData?.capacityUtilization || 0, previous: 0, change: 0 },
      icon: <Target className="w-6 h-6" />,
      format: 'percentage' as const,
      description: 'Overall fill rate',
      onClick: () => handleCardClick('capacity')
    },
  ];

  const showInsights = !isLoading && (
    (kpiData?.revenue?.current || 0) === 0 || 
    (kpiData?.totalEvents || 0) > 0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Key Performance Indicators</h2>
        <PeriodSelector value={selectedPeriod} onValueChange={setSelectedPeriod} />
      </div>
      
      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {primaryKpis.map((kpi, index) => (
          <EnhancedKPICard
            key={`primary-${selectedPeriod}-${index}`}
            title={kpi.title}
            data={kpi.data}
            icon={kpi.icon}
            format={kpi.format}
            isLoading={isLoading}
            onClick={kpi.onClick}
            description={kpi.description}
          />
        ))}
      </div>

      {/* Additional Insights - Show when there's limited transaction data */}
      {showInsights && (
        <>
          <div className="flex justify-between items-center mt-8">
            <h3 className="text-lg font-semibold text-foreground">Event Overview</h3>
            <span className="text-sm text-muted-foreground">
              {(kpiData?.revenue?.current || 0) === 0 ? 'No recent transactions - showing event statistics' : 'Additional insights'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {insightKpis.map((kpi, index) => (
              <EnhancedKPICard
                key={`insight-${index}`}
                title={kpi.title}
                data={kpi.data}
                icon={kpi.icon}
                format={kpi.format}
                isLoading={isLoading}
                onClick={kpi.onClick}
                description={kpi.description}
              />
            ))}
          </div>
        </>
      )}
      
      {error && (
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mx-auto max-w-md">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Data Loading Error</h3>
            <p className="text-red-700 text-sm">
              Unable to load KPI data. Please refresh the page or try again later.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && (kpiData?.totalEvents || 0) === 0 && (
        <div className="text-center py-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mx-auto max-w-md">
            <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">No Events Yet</h3>
            <p className="text-blue-700 text-sm">
              Create your first event to start seeing meaningful KPI data and analytics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
