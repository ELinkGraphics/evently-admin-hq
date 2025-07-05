
import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { EnhancedFinanceDashboard } from "@/components/finance/EnhancedFinanceDashboard";
import { ChapaWebhookTestTable } from "@/components/finance/ChapaWebhookTestTable";
import { ChapaLiveVerifyTable } from "@/components/finance/ChapaLiveVerifyTable";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Finance = () => {
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppHeader />
          
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight">Finance Management</h1>
                  <p className="text-muted-foreground">
                    Comprehensive financial management for your events including budgets, expenses, reports, and tax compliance.
                  </p>
                </div>
                <Button 
                  onClick={() => syncPayments()} 
                  disabled={syncing}
                  className="bg-gradient-primary text-white shadow-sm hover:shadow-md transition-all"
                >
                  {syncing ? "Syncing..." : "Sync Pending Payments"}
                </Button>
              </div>
              
              {syncResults && syncResults.length > 0 && (
                <div className="bg-card rounded-lg border p-4">
                  <div className="font-semibold mb-3 text-card-foreground">Sync Results:</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-3 py-2 text-left">TX Ref</th>
                          <th className="px-3 py-2 text-left">Update</th>
                          <th className="px-3 py-2 text-left">Chapa Status</th>
                          <th className="px-3 py-2 text-left">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncResults.map((r, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-3 py-2">{r.tx_ref}</td>
                            <td className="px-3 py-2">
                              {r.updated ? (
                                <span className="text-success font-semibold">COMPLETED</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2">{r.chapa_status || <span className="text-muted-foreground">N/A</span>}</td>
                            <td className="px-3 py-2">
                              {r.error ? <span className="text-destructive">{r.error}</span> : "-"}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChapaWebhookTestTable />
                <ChapaLiveVerifyTable />
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Finance;
