
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { PaymentManagement } from "@/components/admin/PaymentManagement";

const Payments = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppHeader />
          
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 space-y-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
                <p className="text-muted-foreground">
                  Monitor, verify, and manage all ticket purchase payments across your events.
                </p>
              </div>
              
              <PaymentManagement />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Payments;
