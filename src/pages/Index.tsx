import { useState } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { EnhancedUpcomingEvents } from "@/components/dashboard/EnhancedUpcomingEvents";
import { EnhancedRecentActivity } from "@/components/dashboard/EnhancedRecentActivity";
import { EnhancedQuickActions } from "@/components/dashboard/EnhancedQuickActions";
import { RevenueAnalytics } from "@/components/dashboard/RevenueAnalytics";
import { CustomerAnalytics } from "@/components/dashboard/CustomerAnalytics";
import { PerformanceMetrics } from "@/components/dashboard/PerformanceMetrics";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex w-full">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your events.</p>
            </div>
            <EnhancedQuickActions />
          </div>

          <KPICards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesChart />
            <EnhancedUpcomingEvents />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RevenueAnalytics />
            <CustomerAnalytics />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PerformanceMetrics />
            <EnhancedRecentActivity />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
