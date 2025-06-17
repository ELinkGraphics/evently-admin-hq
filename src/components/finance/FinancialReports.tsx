
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDown, TrendingUp, DollarSign, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const FinancialReports = () => {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<string>('profit-loss');

  // Fetch events
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch financial data
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['financial-data', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return null;
      
      // Get revenue data
      const { data: purchases, error: purchaseError } = await supabase
        .from('ticket_purchases')
        .select('amount_paid, created_at, payment_status')
        .eq('event_id', selectedEvent)
        .eq('payment_status', 'completed');
      
      if (purchaseError) throw purchaseError;

      // Get expense data
      const { data: expenses, error: expenseError } = await supabase
        .from('expense_tracking')
        .select('amount, category, created_at')
        .eq('event_id', selectedEvent);
      
      if (expenseError) throw expenseError;

      // Get budget data - using proper error handling for missing table
      let budgets = [];
      try {
        const { data: budgetData, error: budgetError } = await supabase
          .from('event_budgets')
          .select('*')
          .eq('event_id', selectedEvent);
        
        if (budgetError) throw budgetError;
        budgets = budgetData || [];
      } catch (error) {
        console.log('Budget data not available:', error);
        budgets = [];
      }

      const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.amount_paid), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const netProfit = totalRevenue - totalExpenses;

      // Expense breakdown by category
      const expensesByCategory = expenses.reduce((acc: any, expense) => {
        const category = expense.category;
        acc[category] = (acc[category] || 0) + Number(expense.amount);
        return acc;
      }, {});

      const expenseBreakdown = Object.entries(expensesByCategory).map(([category, amount]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount: amount as number,
        percentage: totalExpenses > 0 ? ((amount as number) / totalExpenses) * 100 : 0
      }));

      // Monthly revenue trend
      const monthlyRevenue = purchases.reduce((acc: any, purchase) => {
        const month = new Date(purchase.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + Number(purchase.amount_paid);
        return acc;
      }, {});

      const revenueTrend = Object.entries(monthlyRevenue).map(([month, amount]) => ({
        month,
        revenue: amount as number
      }));

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        expenseBreakdown,
        revenueTrend,
        budgets,
        purchases: purchases.length
      };
    },
    enabled: !!selectedEvent,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  const generateProfitLossReport = () => {
    if (!financialData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                ETB {financialData.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Expenses</div>
              <div className="text-2xl font-bold text-red-600">
                ETB {financialData.totalExpenses.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Net Profit</div>
              <div className={`text-2xl font-bold ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ETB {Math.abs(financialData.netProfit).toLocaleString()}
                {financialData.netProfit < 0 && ' Loss'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Profit Margin</div>
              <div className={`text-2xl font-bold ${financialData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {financialData.profitMargin.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {financialData.expenseBreakdown.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={financialData.expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {financialData.expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `ETB ${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Revenue', amount: financialData.totalRevenue, fill: '#10B981' },
                    { name: 'Expenses', amount: financialData.totalExpenses, fill: '#EF4444' },
                    { name: 'Net Profit', amount: Math.max(0, financialData.netProfit), fill: '#3B82F6' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `ETB ${Number(value).toLocaleString()}`} />
                    <Bar dataKey="amount" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Amount (ETB)</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total Revenue</TableCell>
                  <TableCell className="text-green-600">{financialData.totalRevenue.toLocaleString()}</TableCell>
                  <TableCell>100%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total Expenses</TableCell>
                  <TableCell className="text-red-600">({financialData.totalExpenses.toLocaleString()})</TableCell>
                  <TableCell>{financialData.totalRevenue > 0 ? ((financialData.totalExpenses / financialData.totalRevenue) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold">Net Profit/Loss</TableCell>
                  <TableCell className={`font-bold ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {financialData.netProfit >= 0 ? '' : '('}
                    {Math.abs(financialData.netProfit).toLocaleString()}
                    {financialData.netProfit < 0 ? ')' : ''}
                  </TableCell>
                  <TableCell className="font-bold">{financialData.profitMargin.toFixed(1)}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Financial Reports
            </div>
            <Button variant="outline" disabled={!selectedEvent}>
              <FileDown className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Select Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit-loss">Profit & Loss Statement</SelectItem>
                  <SelectItem value="expense-analysis">Expense Analysis</SelectItem>
                  <SelectItem value="budget-variance">Budget Variance Report</SelectItem>
                  <SelectItem value="cash-flow">Cash Flow Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEvent && financialData && selectedReport === 'profit-loss' && generateProfitLossReport()}

      {selectedEvent && !financialData && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No financial data available for this event</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
