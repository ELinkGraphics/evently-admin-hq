import { useState } from "react";
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Target, 
  Activity, 
  CheckCircle, 
  Clock, 
  DollarSign,
  BarChart3
} from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { TimePeriod } from "@/lib/dateUtils";
import { PeriodSelector } from "./PeriodSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const BusinessInsights = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const { data: kpiData, isLoading, error } = useKPIData(selectedPeriod);

  const insights = [
    {
      title: "Revenue Performance",
      value: `${kpiData?.revenue?.current?.toLocaleString('et-ET', { style: 'currency', currency: 'ETB' }) || 'ETB 0'}`,
      change: kpiData?.revenue?.change || 0,
      icon: <DollarSign className="w-5 h-5" />,
      description: "Total revenue generated",
      color: "text-green-600 bg-green-50",
    },
    {
      title: "Event Engagement",
      value: `${kpiData?.capacityUtilization?.toFixed(1) || 0}%`,
      change: 0,
      icon: <Target className="w-5 h-5" />,
      description: "Average capacity utilization",
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Active Events",
      value: kpiData?.activeEvents?.toString() || "0",
      change: 0,
      icon: <Activity className="w-5 h-5" />,
      description: "Currently running events",
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "Total Attendees",
      value: kpiData?.ticketsSold?.current?.toString() || "0",
      change: kpiData?.ticketsSold?.change || 0,
      icon: <Users className="w-5 h-5" />,
      description: "People attending events",
      color: "text-orange-600 bg-orange-50",
    },
  ];

  const eventInsights = [
    {
      title: "Published Events",
      value: kpiData?.publishedEvents || 0,
      icon: <CheckCircle className="w-4 h-4" />,
      status: "success" as const,
    },
    {
      title: "Draft Events", 
      value: (kpiData?.totalEvents || 0) - (kpiData?.publishedEvents || 0),
      icon: <Clock className="w-4 h-4" />,
      status: "warning" as const,
    },
    {
      title: "Total Events",
      value: kpiData?.totalEvents || 0,
      icon: <Calendar className="w-4 h-4" />,
      status: "info" as const,
    },
  ];

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-500";
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <BarChart3 className="w-3 h-3 rotate-180" />;
    return null;
  };

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">Unable to Load Insights</h3>
            <p className="text-sm text-muted-foreground">
              Please refresh the page or try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Business Insights
          </h2>
          <p className="text-muted-foreground mt-1">
            Key metrics and performance indicators for your events
          </p>
        </div>
        <PeriodSelector value={selectedPeriod} onValueChange={setSelectedPeriod} />
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {insights.map((insight, index) => (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm"
          >
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2 rounded-lg", insight.color)}>
                      {insight.icon}
                    </div>
                    {insight.change !== 0 && (
                      <div className={cn("flex items-center gap-1 text-xs font-medium", getChangeColor(insight.change))}>
                        {getChangeIcon(insight.change)}
                        <span>{Math.abs(insight.change).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-2xl font-bold text-foreground mb-1">
                      {insight.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Event Status Overview */}
      <Card className="border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Event Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-32 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {eventInsights.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-lg border bg-background/50">
                  <div className={cn(
                    "p-2 rounded-full",
                    item.status === 'success' && "bg-green-100 text-green-600",
                    item.status === 'warning' && "bg-yellow-100 text-yellow-600", 
                    item.status === 'info' && "bg-blue-100 text-blue-600"
                  )}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {!isLoading && !error && (kpiData?.totalEvents || 0) === 0 && (
        <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Start Your Journey</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create your first event to unlock powerful insights and analytics for your business.
            </p>
            <Badge variant="outline" className="mt-4">
              No events created yet
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
};