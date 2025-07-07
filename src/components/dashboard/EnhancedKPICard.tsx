
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/dateUtils";

interface KPIData {
  current: number;
  previous: number;
  change: number;
}

interface EnhancedKPICardProps {
  title: string;
  data: KPIData;
  icon: React.ReactNode;
  format?: 'currency' | 'number' | 'percentage';
  isLoading?: boolean;
  onClick?: () => void;
  description?: string;
}

export const EnhancedKPICard = ({ 
  title, 
  data, 
  icon, 
  format = 'number',
  isLoading,
  onClick,
  description
}: EnhancedKPICardProps) => {
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      default:
        return formatNumber(value);
    }
  };

  const isPositiveChange = data.change > 0;
  const isNeutralChange = data.change === 0;
  const changeColor = isNeutralChange ? "text-gray-500" : (isPositiveChange ? "text-green-600" : "text-red-600");
  
  // Show change only if there's meaningful previous data
  const showChange = data.previous > 0 && data.change !== 0;

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="h-3 w-16 mt-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "bg-white/60 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300",
        onClick && "cursor-pointer hover:bg-white/80"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-2">
              {formatValue(data.current)}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="text-2xl text-muted-foreground">{icon}</div>
            {showChange && (
              <div className={cn("flex items-center space-x-1 text-sm font-medium", changeColor)}>
                {isPositiveChange ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(data.change).toFixed(1)}%</span>
              </div>
            )}
            {!showChange && data.current > 0 && (
              <div className="flex items-center space-x-1 text-sm font-medium text-blue-600">
                <Minus className="w-4 h-4" />
                <span>Total</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
