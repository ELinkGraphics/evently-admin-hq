
import { useState } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EnhancedFinanceDashboard } from "@/components/finance/EnhancedFinanceDashboard";
import { ChapaWebhookTestTable } from "@/components/finance/ChapaWebhookTestTable";
import { ChapaLiveVerifyTable } from "@/components/finance/ChapaLiveVerifyTable";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Finance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [syncResults, setSyncResults] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const { mutate: syncPayments } = useMutation({
    mutationFn: async () => {
      setSyncing(true);
      setSyncResults([]);
      const { data, error } = await supabase.functions.invoke("auto-sync-chapa-payment", {
        body: {},
      });
      setSyncing(false);

      if (error) {
        toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
        return { results: [], error: error.message };
      }
      toast({ title: "Payment Sync Complete" });
      setSyncResults(data?.results || []);
      return data;
    },
  });

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
                Comprehensive financial management for your events including budgets, expenses, reports, and tax compliance.
              </p>
            </div>
            <div>
              <Button onClick={() => syncPayments()} disabled={syncing}>
                {syncing ? "Syncing..." : "Sync Pending Payments"}
              </Button>
            </div>
          </div>
          
          {syncResults && syncResults.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold mb-2">Sync Results:</div>
              <div className="overflow-x-auto border p-2 rounded bg-white">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-2 py-1">TX Ref</th>
                      <th className="px-2 py-1">Update</th>
                      <th className="px-2 py-1">Chapa Status</th>
                      <th className="px-2 py-1">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncResults.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{r.tx_ref}</td>
                        <td className="px-2 py-1">
                          {r.updated ? (
                            <span className="text-green-500 font-semibold">COMPLETED</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-2 py-1">{r.chapa_status || <span className="text-gray-400">N/A</span>}</td>
                        <td className="px-2 py-1">
                          {r.error ? <span className="text-red-500">{r.error}</span> : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Enhanced Finance Dashboard with all features */}
          <EnhancedFinanceDashboard />

          {/* Payment tracking tables */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <ChapaWebhookTestTable />
            </div>
            <div className="flex-1 min-w-0">
              <ChapaLiveVerifyTable />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Finance;
