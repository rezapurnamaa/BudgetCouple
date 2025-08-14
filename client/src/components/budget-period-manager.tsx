import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import type { Category, BudgetPeriod, Expense } from '@shared/schema';

interface BudgetFormData {
  categoryId: string;
  startDate: string;
  endDate: string;
  budgetAmount: string;
}

export function BudgetPeriodManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetPeriod | null>(null);
  const [formData, setFormData] = useState<BudgetFormData>({
    categoryId: '',
    startDate: '',
    endDate: '',
    budgetAmount: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: budgetPeriods = [] } = useQuery<BudgetPeriod[]>({
    queryKey: ['/api/budget-periods'],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      return await apiRequest('/api/budget-periods', {
        method: 'POST',
        body: {
          name: `${categories.find(c => c.id === data.categoryId)?.name} Budget`,
          categoryId: data.categoryId,
          startDate: data.startDate,
          endDate: data.endDate,
          budgetAmount: data.budgetAmount,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Budget Period Created',
        description: 'Budget period has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budget-periods'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create budget period',
        variant: 'destructive',
      });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ budgetId, data }: { budgetId: string; data: BudgetFormData }) => {
      return await apiRequest(`/api/budget-periods/${budgetId}`, {
        method: 'PATCH',
        body: {
          name: `${categories.find(c => c.id === data.categoryId)?.name} Budget`,
          categoryId: data.categoryId,
          startDate: data.startDate,
          endDate: data.endDate,
          budgetAmount: data.budgetAmount,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Budget Period Updated',
        description: 'Budget period has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budget-periods'] });
      setEditingBudget(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update budget period',
        variant: 'destructive',
      });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      return await apiRequest(`/api/budget-periods/${budgetId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Budget Period Deleted',
        description: 'Budget period has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budget-periods'] });
    },
    onError: (error) => {
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete budget period',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      categoryId: '',
      startDate: '',
      endDate: '',
      budgetAmount: '',
    });
  };

  const handleCreate = () => {
    if (!formData.categoryId || !formData.startDate || !formData.endDate || !formData.budgetAmount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (isAfter(parseISO(formData.startDate), parseISO(formData.endDate))) {
      toast({
        title: 'Validation Error',
        description: 'Start date must be before end date.',
        variant: 'destructive',
      });
      return;
    }

    createBudgetMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingBudget) return;
    
    if (!formData.categoryId || !formData.startDate || !formData.endDate || !formData.budgetAmount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (isAfter(parseISO(formData.startDate), parseISO(formData.endDate))) {
      toast({
        title: 'Validation Error',
        description: 'Start date must be before end date.',
        variant: 'destructive',
      });
      return;
    }

    updateBudgetMutation.mutate({
      budgetId: editingBudget.id,
      data: formData,
    });
  };

  const startEditing = (budget: BudgetPeriod) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      startDate: format(new Date(budget.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(budget.endDate), 'yyyy-MM-dd'),
      budgetAmount: budget.budgetAmount,
    });
  };

  const getSpentAmount = (budget: BudgetPeriod): number => {
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    
    return expenses
      .filter((expense) => 
        expense.categoryId === budget.categoryId &&
        expense.date &&
        new Date(expense.date) >= startDate &&
        new Date(expense.date) <= endDate
      )
      .reduce((sum: number, expense) => {
        const amount = parseFloat(expense.amount || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
  };

  const getCategory = (categoryId: string) => categories.find(c => c.id === categoryId);

  const getBudgetStatus = (budget: BudgetPeriod) => {
    const spent = getSpentAmount(budget);
    const budgetAmount = parseFloat(budget.budgetAmount);
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
    
    if (percentage >= 100) return { status: 'danger', label: 'Over Budget' };
    if (percentage >= 80) return { status: 'warning', label: 'Near Limit' };
    return { status: 'success', label: 'On Track' };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Budget Periods</span>
              </CardTitle>
              <CardDescription>
                Manage budgets for specific time periods and categories
              </CardDescription>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-budget">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Budget Period
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Budget Period</DialogTitle>
                  <DialogDescription>
                    Set a budget for a specific category and time period.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                    >
                      <SelectTrigger data-testid="select-budget-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center space-x-2">
                              <span>{category.emoji}</span>
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        data-testid="input-budget-start-date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        data-testid="input-budget-end-date"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="budgetAmount">Budget Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        €
                      </span>
                      <Input
                        id="budgetAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.budgetAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, budgetAmount: e.target.value }))}
                        className="pl-8"
                        placeholder="0.00"
                        data-testid="input-budget-amount"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createBudgetMutation.isPending}
                    data-testid="button-save-budget"
                  >
                    Create Budget Period
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {budgetPeriods.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No budget periods created yet.</p>
              <p className="text-sm text-muted-foreground">Create your first budget period to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgetPeriods.map((budget) => {
                const category = getCategory(budget.categoryId);
                const spent = getSpentAmount(budget);
                const budgetAmount = parseFloat(budget.budgetAmount);
                const remaining = budgetAmount - spent;
                const percentage = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;
                const status = getBudgetStatus(budget);

                return (
                  <Card key={budget.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{category?.emoji}</span>
                          <div>
                            <h3 className="font-semibold">{category?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(budget.startDate), 'MMM d, yyyy')} - {format(new Date(budget.endDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            status.status === 'danger' ? 'destructive' :
                            status.status === 'warning' ? 'secondary' :
                            'default'
                          }>
                            {status.label}
                          </Badge>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(budget)}
                            data-testid={`button-edit-budget-${budget.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBudgetMutation.mutate(budget.id)}
                            data-testid={`button-delete-budget-${budget.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Budget</p>
                          <p className="font-semibold text-lg">€{budgetAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Spent</p>
                          <p className="font-semibold text-lg">€{spent.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {remaining >= 0 ? 'Remaining' : 'Over'}
                          </p>
                          <p className={`font-semibold text-lg ${
                            remaining >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            €{Math.abs(remaining).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage >= 100 ? 'bg-red-500' :
                            percentage >= 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {percentage.toFixed(1)}% used
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Budget Dialog */}
      <Dialog open={!!editingBudget} onOpenChange={(open) => !open && setEditingBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget Period</DialogTitle>
            <DialogDescription>
              Update the budget period details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <span>{category.emoji}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-budgetAmount">Budget Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  €
                </span>
                <Input
                  id="edit-budgetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budgetAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, budgetAmount: e.target.value }))}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingBudget(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateBudgetMutation.isPending}
            >
              Update Budget Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}