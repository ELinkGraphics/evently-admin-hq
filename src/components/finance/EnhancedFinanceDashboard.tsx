
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetManagement } from "./BudgetManagement";
import { ExpenseManagement } from "./ExpenseManagement";
import { FinancialReports } from "./FinancialReports";
import { TaxManagement } from "./TaxManagement";
import { FinanceDashboard } from "./FinanceDashboard";
import { Target, Receipt, BarChart3, Calculator, DollarSign } from "lucide-react";

export const EnhancedFinanceDashboard = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center">
            <Receipt className="w-4 h-4 mr-2" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Tax
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FinanceDashboard />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetManagement />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpenseManagement />
        </TabsContent>

        <TabsContent value="reports">
          <FinancialReports />
        </TabsContent>

        <TabsContent value="tax">
          <TaxManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
