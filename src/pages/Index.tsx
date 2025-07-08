import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { BusinessInsights } from "@/components/dashboard/BusinessInsights";
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
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppHeader />
          
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 space-y-8">
              {/* Enhanced Page Header */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 rounded-2xl -z-10" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      Dashboard
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      Welcome back! Here's what's happening with your events.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <EnhancedQuickActions />
                  </div>
                </div>
              </div>

              {/* Business Insights */}
              <BusinessInsights />

              {/* Enhanced Main Content Grid */}
              <div className="grid gap-8">
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="transform hover:scale-[1.02] transition-transform duration-300">
                    <SalesChart />
                  </div>
                  <div className="transform hover:scale-[1.02] transition-transform duration-300">
                    <EnhancedUpcomingEvents />
                  </div>
                </div>

                {/* Analytics Row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="transform hover:scale-[1.02] transition-transform duration-300">
                    <RevenueAnalytics />
                  </div>
                  <div className="transform hover:scale-[1.02] transition-transform duration-300">
                    <CustomerAnalytics />
                  </div>
                </div>

                {/* Performance Row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="transform hover:scale-[1.02] transition-transform duration-300">
                    <PerformanceMetrics />
                  </div>
                  <div className="transform hover:scale-[1.02] transition-transform duration-300">
                    <EnhancedRecentActivity />
                  </div>
                </div>
              </div>

              {/* Bottom Spacer */}
              <div className="h-8" />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
