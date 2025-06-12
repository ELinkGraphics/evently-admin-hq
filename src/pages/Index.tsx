
import { useState } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";

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
            <QuickActions />
          </div>

          <KPICards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesChart />
            <UpcomingEvents />
          </div>

          <RecentActivity />
        </main>
      </div>
    </div>
  );
};

export default Index;
