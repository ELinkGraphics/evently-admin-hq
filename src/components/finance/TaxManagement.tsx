
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calculator, FileText, Download, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const TaxManagement = () => {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [taxRate, setTaxRate] = useState('15'); // Default VAT rate for Ethiopia

  // Fetch events
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch tax data
  const { data: taxData, isLoading } = useQuery({
    queryKey: ['tax-data', selectedEvent, taxRate],
    queryFn: async () => {
      if (!selectedEvent) return null;
      
      // Get revenue data
      const { data: purchases, error: purchaseError } = await supabase
        .from('ticket_purchases')
        .select('amount_paid, created_at, buyer_name, buyer_email')
        .eq('event_id', selectedEvent)
        .eq('payment_status', 'completed');
      
      if (purchaseError) throw purchaseError;

      // Get expense data
      const { data: expenses, error: expenseError } = await supabase
        .from('expense_tracking')
        .select('amount, category, description')
        .eq('event_id', selectedEvent);
      
      if (expenseError) throw expenseError;

      const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.amount_paid), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const taxableIncome = totalRevenue - totalExpenses;
      const taxAmount = (taxableIncome * Number(taxRate)) / 100;
      const netIncome = taxableIncome - taxAmount;

      // Monthly breakdown
      const monthlyData = purchases.reduce((acc: any, purchase) => {
        const month = new Date(purchase.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = { revenue: 0, transactions: 0 };
        }
        acc[month].revenue += Number(purchase.amount_paid);
        acc[month].transactions += 1;
        return acc;
      }, {});

      const monthlyBreakdown = Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
        month,
        revenue: data.revenue,
        transactions: data.transactions,
        taxAmount: (data.revenue * Number(taxRate)) / 100
      }));

      return {
        totalRevenue,
        totalExpenses,
        taxableIncome,
        taxAmount,
        netIncome,
        taxRate: Number(taxRate),
        monthlyBreakdown,
        purchases,
        expenses
      };
    },
    enabled: !!selectedEvent,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Tax Management & Compliance
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
              <Label>VAT Rate (%)</Label>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="15"
              />
            </div>
          </div>

          {selectedEvent && taxData && (
            <>
              {/* Tax Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Gross Revenue</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ETB {taxData.totalRevenue.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Deductible Expenses</div>
                    <div className="text-2xl font-bold text-orange-600">
                      ETB {taxData.totalExpenses.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Taxable Income</div>
                    <div className="text-2xl font-bold text-green-600">
                      ETB {taxData.taxableIncome.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">VAT Due ({taxData.taxRate}%)</div>
                    <div className="text-2xl font-bold text-red-600">
                      ETB {taxData.taxAmount.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tax Calculation Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax Calculation Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount (ETB)</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Gross Revenue</TableCell>
                        <TableCell>{taxData.totalRevenue.toLocaleString()}</TableCell>
                        <TableCell>Total ticket sales revenue</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Less: Business Expenses</TableCell>
                        <TableCell className="text-red-600">({taxData.totalExpenses.toLocaleString()})</TableCell>
                        <TableCell>Deductible operational expenses</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold">Taxable Income</TableCell>
                        <TableCell className="font-bold">{taxData.taxableIncome.toLocaleString()}</TableCell>
                        <TableCell>Subject to VAT</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">VAT @ {taxData.taxRate}%</TableCell>
                        <TableCell className="text-red-600 font-medium">{taxData.taxAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Due
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold">Net Income After Tax</TableCell>
                        <TableCell className="font-bold text-green-600">{taxData.netIncome.toLocaleString()}</TableCell>
                        <TableCell>Final profit after tax</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Monthly Tax Breakdown */}
              {taxData.monthlyBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Tax Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Transactions</TableHead>
                          <TableHead>VAT Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taxData.monthlyBreakdown.map((month) => (
                          <TableRow key={month.month}>
                            <TableCell className="font-medium">{month.month}</TableCell>
                            <TableCell>ETB {month.revenue.toLocaleString()}</TableCell>
                            <TableCell>{month.transactions}</TableCell>
                            <TableCell className="text-red-600">ETB {month.taxAmount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Tax Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax Reports & Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <FileText className="w-6 h-6 mb-2" />
                      VAT Return Form
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <Download className="w-6 h-6 mb-2" />
                      Revenue Summary
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <Calculator className="w-6 h-6 mb-2" />
                      Tax Calculation Sheet
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax Compliance Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-amber-500" />
                      <span>VAT returns must be filed monthly by the 15th of the following month</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-amber-500" />
                      <span>Keep all receipts and invoices for expense deductions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-amber-500" />
                      <span>Business registration required for VAT collection and remittance</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-amber-500" />
                      <span>Consult with a tax professional for complex situations</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
