
import { useState } from "react";
import { DollarSign, Ticket, TrendingUp, ShoppingCart } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { TimePeriod } from "@/lib/dateUtils";
import { PeriodSelector } from "./PeriodSelector";
import { EnhancedKPICard } from "./EnhancedKPICard";
import { useToast } from "@/hooks/use-toast";

export const KPICards = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const { data: kpiData, isLoading, error } = useKPIData(selectedPeriod);
  const { toast } = useToast();

  console.log('KPICards - Loading:', isLoading, 'Error:', error, 'Data:', kpiData);

  const handleCardClick = (cardType: string) => {
    toast({
      title: "Drill Down",
      description: `Detailed ${cardType} analytics coming soon!`,
    });
  };

  if (error) {
    console.error('Error loading KPI data:', error);
    toast({
      title: "Error",
      description: "Failed to load KPI data. Please try again.",
      variant: "destructive",
    });
  }

  const kpiCards = [
    {
      title: "Total Revenue",
      data: kpiData?.revenue || { current: 0, previous: 0, change: 0 },
      icon: <DollarSign className="w-6 h-6" />,
      format: 'currency' as const,
      description: `vs. previous ${selectedPeriod}`,
      onClick: () => handleCardClick('revenue')
    },
    {
      title: "Tickets Sold",
      data: kpiData?.ticketsSold || { current: 0, previous: 0, change: 0 },
      icon: <Ticket className="w-6 h-6" />,
      format: 'number' as const,
      description: `vs. previous ${selectedPeriod}`,
      onClick: () => handleCardClick('tickets')
    },
    {
      title: "Avg Ticket Price",
      data: kpiData?.averageTicketPrice || { current: 0, previous: 0, change: 0 },
      icon: <TrendingUp className="w-6 h-6" />,
      format: 'currency' as const,
      description: `vs. previous ${selectedPeriod}`,
      onClick: () => handleCardClick('pricing')
    },
    {
      title: "Transactions",
      data: kpiData?.transactions || { current: 0, previous: 0, change: 0 },
      icon: <ShoppingCart className="w-6 h-6" />,
      format: 'number' as const,
      description: `vs. previous ${selectedPeriod}`,
      onClick: () => handleCardClick('transactions')
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Key Performance Indicators</h2>
        <PeriodSelector value={selectedPeriod} onValueChange={setSelectedPeriod} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <EnhancedKPICard
            key={index}
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
      
      {error && (
        <div className="text-center text-red-500 text-sm mt-4">
          Unable to load KPI data. Please check the console for more details.
        </div>
      )}
    </div>
  );
};
