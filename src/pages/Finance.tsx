
import { useState } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FinanceDashboard } from "@/components/finance/FinanceDashboard";

const Finance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex w-full">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Finance Management</h1>
              <p className="text-muted-foreground mt-1">
                Analyze your revenue, manage payments, track budgets, and generate reports for your events.
              </p>
            </div>
          </div>
          <FinanceDashboard />
        </main>
      </div>
    </div>
  );
};

export default Finance;
