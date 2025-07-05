import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { EnhancedUpcomingEvents } from "@/components/dashboard/EnhancedUpcomingEvents";
import { EnhancedRecentActivity } from "@/components/dashboard/EnhancedRecentActivity";
import { EnhancedQuickActions } from "@/components/dashboard/EnhancedQuickActions";
import { RevenueAnalytics } from "@/components/dashboard/RevenueAnalytics";
import { CustomerAnalytics } from "@/components/dashboard/CustomerAnalytics";
import { PerformanceMetrics } from "@/components/dashboard/PerformanceMetrics";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppHeader />
          
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 space-y-8">
              {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                  <p className="text-muted-foreground">
                    Welcome back! Here's what's happening with your events.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <EnhancedQuickActions />
                </div>
              </div>

              {/* KPI Cards */}
              <KPICards />

              {/* Main Content Grid */}
              <div className="grid gap-6">
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SalesChart />
                  <EnhancedUpcomingEvents />
                </div>

                {/* Analytics Row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <RevenueAnalytics />
                  <CustomerAnalytics />
                </div>

                {/* Performance Row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <PerformanceMetrics />
                  <EnhancedRecentActivity />
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
