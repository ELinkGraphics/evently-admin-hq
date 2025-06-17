
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const BudgetManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Fetch events for budget selection
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch budgets with actual spending
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return [];
      
      // Get budget data
      const { data: budgetData, error: budgetError } = await supabase
        .from('event_budgets')
        .select('*')
        .eq('event_id', selectedEvent);
      
      if (budgetError) throw budgetError;

      // Get actual spending
      const { data: expenseData, error: expenseError } = await supabase
        .from('expense_tracking')
        .select('category, amount')
        .eq('event_id', selectedEvent);
      
      if (expenseError) throw expenseError;

      // Combine budget and actual data
      const expensesByCategory = expenseData.reduce((acc: any, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
        return acc;
      }, {});

      return budgetData.map(budget => ({
        ...budget,
        actualSpent: expensesByCategory[budget.category] || 0,
        variance: Number(budget.budgeted_amount) - (expensesByCategory[budget.category] || 0),
        percentageUsed: ((expensesByCategory[budget.category] || 0) / Number(budget.budgeted_amount)) * 100
      }));
    },
    enabled: !!selectedEvent,
  });

  // Add budget mutation
  const addBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('event_budgets').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setBudgetCategory('');
      setBudgetAmount('');
      toast({ title: "Budget added successfully" });
    },
  });

  const handleAddBudget = () => {
    if (!selectedEvent || !budgetCategory || !budgetAmount) return;
    
    addBudgetMutation.mutate({
      event_id: selectedEvent,
      category: budgetCategory,
      budgeted_amount: Number(budgetAmount),
      currency: 'ETB'
    });
  };

  const getBudgetStatus = (percentageUsed: number) => {
    if (percentageUsed > 100) return { color: 'destructive', icon: AlertTriangle, label: 'Over Budget' };
    if (percentageUsed > 80) return { color: 'secondary', icon: TrendingUp, label: 'Near Limit' };
    return { color: 'default', icon: Target, label: 'On Track' };
  };

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.budgeted_amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.actualSpent, 0);
  const totalVariance = totalBudget - totalSpent;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Budget Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Selection */}
          <div>
            <Label htmlFor="event-select">Select Event</Label>
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

          {/* Budget Summary */}
          {selectedEvent && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Budget</div>
                  <div className="text-2xl font-bold text-blue-600">ETB {totalBudget.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                  <div className="text-2xl font-bold text-orange-600">ETB {totalSpent.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Variance</div>
                  <div className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ETB {Math.abs(totalVariance).toLocaleString()}
                    {totalVariance < 0 && ' Over'}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Add Budget */}
          {selectedEvent && (
            <div className="flex gap-2">
              <Select value={budgetCategory} onValueChange={setBudgetCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="catering">Catering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Budget amount"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                type="number"
              />
              <Button onClick={handleAddBudget} disabled={addBudgetMutation.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                Add Budget
              </Button>
            </div>
          )}

          {/* Budget Table */}
          {selectedEvent && budgets.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Budgeted</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => {
                  const status = getBudgetStatus(budget.percentageUsed);
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium capitalize">{budget.category}</TableCell>
                      <TableCell>ETB {Number(budget.budgeted_amount).toLocaleString()}</TableCell>
                      <TableCell>ETB {budget.actualSpent.toLocaleString()}</TableCell>
                      <TableCell className={budget.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ETB {Math.abs(budget.variance).toLocaleString()}
                        {budget.variance < 0 && ' Over'}
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress value={Math.min(budget.percentageUsed, 100)} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {budget.percentageUsed.toFixed(0)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.color as any} className="flex items-center w-fit">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
