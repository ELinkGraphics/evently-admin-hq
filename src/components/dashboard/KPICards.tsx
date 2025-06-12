
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const kpis = [
  {
    title: "Total Revenue",
    value: "$24,580",
    change: "+12.5%",
    trend: "up",
    description: "From last month",
  },
  {
    title: "Tickets Sold",
    value: "1,247",
    change: "+8.2%",
    trend: "up",
    description: "This month",
  },
  {
    title: "Upcoming Events",
    value: "12",
    change: "+3",
    trend: "up",
    description: "Next 30 days",
  },
  {
    title: "New Attendees",
    value: "324",
    change: "-2.1%",
    trend: "down",
    description: "This week",
  },
];

export const KPICards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <Card key={index} className="bg-white/60 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{kpi.value}</p>
              </div>
              <div className={`flex items-center space-x-1 text-sm font-medium ${
                kpi.trend === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {kpi.trend === "up" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{kpi.change}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
