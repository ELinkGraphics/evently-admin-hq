
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  BarChart3, 
  FileText, 
  Settings, 
  Download,
  Plus,
  Mail
} from "lucide-react";
import { EventFormDialog } from "@/components/events/EventFormDialog";
import { useEvents } from "@/hooks/useEvents";
import { useToast } from "@/hooks/use-toast";

export const EnhancedQuickActions = () => {
  const { createEvent, isCreating } = useEvents();
  const { toast } = useToast();

  const handleViewOrders = () => {
    toast({
      title: "View Orders",
      description: "Orders management coming soon!",
    });
  };

  const handleAnalytics = () => {
    toast({
      title: "Analytics",
      description: "Advanced analytics dashboard coming soon!",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Data",
      description: "Data export functionality coming soon!",
    });
  };

  const handleSendEmail = () => {
    toast({
      title: "Send Email",
      description: "Email campaign feature coming soon!",
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: "Generate Report",
      description: "Report generation coming soon!",
    });
  };

  const handleSettings = () => {
    toast({
      title: "Settings",
      description: "Settings panel coming soon!",
    });
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <EventFormDialog onSubmit={createEvent} isLoading={isCreating} />
      
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-white/50 hover:bg-white/80 flex items-center justify-center"
        onClick={handleViewOrders}
      >
        <Users className="w-4 h-4 mr-2" />
        View Orders
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-white/50 hover:bg-white/80 flex items-center justify-center"
        onClick={handleAnalytics}
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        Analytics
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-white/50 hover:bg-white/80 flex items-center justify-center"
        onClick={handleExportData}
      >
        <Download className="w-4 h-4 mr-2" />
        Export Data
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-white/50 hover:bg-white/80 flex items-center justify-center"
        onClick={handleSendEmail}
      >
        <Mail className="w-4 h-4 mr-2" />
        Send Email
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-white/50 hover:bg-white/80 flex items-center justify-center"
        onClick={handleGenerateReport}
      >
        <FileText className="w-4 h-4 mr-2" />
        Reports
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-white/50 hover:bg-white/80 flex items-center justify-center"
        onClick={handleSettings}
      >
        <Settings className="w-4 h-4 mr-2" />
        Settings
      </Button>
    </div>
  );
};
