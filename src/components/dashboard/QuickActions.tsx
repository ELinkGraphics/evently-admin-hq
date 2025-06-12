
import { Button } from "@/components/ui/button";
import { Calendar, Users, CreditCard, BarChart3 } from "lucide-react";

export const QuickActions = () => {
  return (
    <div className="flex space-x-3">
      <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80">
        <Calendar className="w-4 h-4 mr-2" />
        New Event
      </Button>
      <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80">
        <Users className="w-4 h-4 mr-2" />
        View Orders
      </Button>
      <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/80">
        <BarChart3 className="w-4 h-4 mr-2" />
        Analytics
      </Button>
    </div>
  );
};
