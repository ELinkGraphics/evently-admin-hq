
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Receipt, Upload, Eye, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

export const ExpenseManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    receipt_url: ''
  });

  // Fetch events
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch expenses
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return [];
      
      const { data, error } = await supabase
        .from('expense_tracking')
        .select('*')
        .eq('event_id', selectedEvent)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEvent,
  });

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('expense_tracking').insert([{
        ...data,
        event_id: selectedEvent,
        created_at: new Date().toISOString()
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setFormData({ category: '', description: '', amount: '', receipt_url: '' });
      setShowAddExpense(false);
      toast({ title: "Expense added successfully" });
    },
  });

  const handleAddExpense = () => {
    if (!selectedEvent || !formData.category || !formData.description || !formData.amount) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    addExpenseMutation.mutate({
      ...formData,
      amount: Number(formData.amount)
    });
  };

  const getStatusBadge = (paidAt: string | null) => {
    if (paidAt) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const paidExpenses = expenses.filter(exp => exp.paid_at).reduce((sum, exp) => sum + Number(exp.amount), 0);
  const pendingExpenses = totalExpenses - paidExpenses;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Receipt className="w-5 h-5 mr-2" />
              Expense Management
            </div>
            {selectedEvent && (
              <Button onClick={() => setShowAddExpense(!showAddExpense)}>
                Add Expense
              </Button>
            )}
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

          {/* Expense Summary */}
          {selectedEvent && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Expenses</div>
                  <div className="text-2xl font-bold text-red-600">ETB {totalExpenses.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Paid</div>
                  <div className="text-2xl font-bold text-green-600">ETB {paidExpenses.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-2xl font-bold text-orange-600">ETB {pendingExpenses.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Add Expense Form */}
          {showAddExpense && selectedEvent && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Expense</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venue">Venue</SelectItem>
                        <SelectItem value="catering">Catering</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount (ETB)</Label>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Expense description..."
                  />
                </div>
                <div>
                  <Label>Receipt URL (optional)</Label>
                  <Input
                    value={formData.receipt_url}
                    onChange={(e) => setFormData({...formData, receipt_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddExpense} disabled={addExpenseMutation.isPending}>
                    Add Expense
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddExpense(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expenses Table */}
          {selectedEvent && expenses.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium capitalize">{expense.category}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>ETB {Number(expense.amount).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(expense.paid_at)}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}</TableCell>
                    <TableCell>
                      {expense.receipt_url ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No receipt</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {selectedEvent && expenses.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4" />
              <p>No expenses recorded for this event</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
