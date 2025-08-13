import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Edit2, Save, X, AlertTriangle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import type { Expense, Category, Partner } from '@shared/schema';

interface ExpenseVerificationProps {
  statementId: string;
}

interface EditingExpense extends Expense {
  editedAmount: string;
  editedDescription: string;
  editedCategoryId: string;
  editedPartnerId: string;
  editedDate: string;
}

export function ExpenseVerification({ statementId }: ExpenseVerificationProps) {
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editedExpenses, setEditedExpenses] = useState<Record<string, EditingExpense>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch expenses from statement
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses/statement', statementId],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async ({ expenseId, updates }: { expenseId: string; updates: Partial<Expense> }) => {
      return await apiRequest(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Expense Updated',
        description: 'The expense has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update expense',
        variant: 'destructive',
      });
    },
  });

  // Verify expense mutation
  const verifyExpenseMutation = useMutation({
    mutationFn: async ({ expenseId, action }: { expenseId: string; action: 'verify' | 'reject' }) => {
      return await apiRequest(`/api/expenses/${expenseId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    },
  });

  // Currency format validation
  const validateCurrencyFormat = (amount: string, originalAmount?: string): { isValid: boolean; suggestion?: string; issues: string[] } => {
    const issues: string[] = [];
    let suggestion = amount;

    // Check for common European decimal separator issues
    if (originalAmount && originalAmount.includes(',')) {
      // European format: 1.234,56 or 1234,56
      const europeanPattern = /^(\d{1,3}(?:\.\d{3})*),(\d{2})$/;
      if (europeanPattern.test(originalAmount)) {
        suggestion = originalAmount.replace(/\./g, '').replace(',', '.');
        if (amount !== suggestion) {
          issues.push('Decimal separator appears to be European format (comma)');
        }
      }
    }

    // Check for invalid decimal places
    const decimalPattern = /^\d+\.?\d{0,2}$/;
    if (!decimalPattern.test(amount.replace(/[,\s]/g, ''))) {
      issues.push('Amount should have at most 2 decimal places');
    }

    // Check for obviously wrong amounts (too many digits, etc.)
    const numericAmount = parseFloat(amount.replace(/[,\s]/g, ''));
    if (isNaN(numericAmount)) {
      issues.push('Amount is not a valid number');
    } else if (numericAmount > 100000) {
      issues.push('Amount seems unusually high - please verify');
    } else if (numericAmount < 0) {
      issues.push('Amount should be positive');
    }

    return {
      isValid: issues.length === 0,
      suggestion: suggestion !== amount ? suggestion : undefined,
      issues,
    };
  };

  const startEditing = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setEditedExpenses(prev => ({
      ...prev,
      [expense.id]: {
        ...expense,
        editedAmount: expense.amount,
        editedDescription: expense.description,
        editedCategoryId: expense.categoryId,
        editedPartnerId: expense.partnerId,
        editedDate: expense.date ? format(new Date(expense.date), 'yyyy-MM-dd') : '',
      }
    }));
  };

  const cancelEditing = () => {
    setEditingExpenseId(null);
    setEditedExpenses(prev => {
      const newState = { ...prev };
      if (editingExpenseId) {
        delete newState[editingExpenseId];
      }
      return newState;
    });
  };

  const saveExpense = (expenseId: string) => {
    const editedExpense = editedExpenses[expenseId];
    if (!editedExpense) return;

    updateExpenseMutation.mutate({
      expenseId,
      updates: {
        amount: editedExpense.editedAmount,
        description: editedExpense.editedDescription,
        categoryId: editedExpense.editedCategoryId,
        partnerId: editedExpense.editedPartnerId,
        date: new Date(editedExpense.editedDate),
        isVerified: 'verified',
      },
    });

    setEditingExpenseId(null);
    setEditedExpenses(prev => {
      const newState = { ...prev };
      delete newState[expenseId];
      return newState;
    });
  };

  const getCategory = (categoryId: string) => categories.find(c => c.id === categoryId);
  const getPartner = (partnerId: string) => partners.find(p => p.id === partnerId);

  if (isLoading) {
    return <div className="text-center py-8">Loading expenses...</div>;
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Expenses Found</CardTitle>
          <CardDescription>No expenses found for this statement.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Verify Uploaded Expenses</span>
          </CardTitle>
          <CardDescription>
            Review and verify the uploaded expenses. Check currency formats and edit details as needed.
          </CardDescription>
        </CardHeader>
      </Card>

      {expenses.map((expense) => {
        const isEditing = editingExpenseId === expense.id;
        const editedExpense = editedExpenses[expense.id];
        const category = getCategory(expense.categoryId);
        const partner = getPartner(expense.partnerId);
        
        const currencyValidation = validateCurrencyFormat(
          expense.amount, 
          expense.originalAmount || undefined
        );

        return (
          <Card key={expense.id} className={`${
            expense.isVerified === 'pending' ? 'border-yellow-200 bg-yellow-50' :
            expense.isVerified === 'verified' ? 'border-green-200 bg-green-50' :
            'border-red-200 bg-red-50'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Badge variant={
                    expense.isVerified === 'pending' ? 'secondary' :
                    expense.isVerified === 'verified' ? 'default' :
                    'destructive'
                  }>
                    {expense.isVerified === 'pending' ? 'Pending' :
                     expense.isVerified === 'verified' ? 'Verified' :
                     'Rejected'}
                  </Badge>
                  
                  {!currencyValidation.isValid && (
                    <Badge variant="destructive" className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Currency Issues</span>
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {!isEditing && expense.isVerified === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(expense)}
                        data-testid={`button-edit-${expense.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => verifyExpenseMutation.mutate({ 
                          expenseId: expense.id, 
                          action: 'verify' 
                        })}
                        data-testid={`button-verify-${expense.id}`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => verifyExpenseMutation.mutate({ 
                          expenseId: expense.id, 
                          action: 'reject' 
                        })}
                        data-testid={`button-reject-${expense.id}`}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  {isEditing && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => saveExpense(expense.id)}
                        disabled={updateExpenseMutation.isPending}
                        data-testid={`button-save-${expense.id}`}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        data-testid={`button-cancel-${expense.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Currency Format Issues */}
              {!currencyValidation.isValid && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Currency Format Issues:</span>
                  </div>
                  <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                    {currencyValidation.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                  {currencyValidation.suggestion && (
                    <p className="text-sm text-yellow-700 mt-2">
                      <strong>Suggestion:</strong> {currencyValidation.suggestion}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        €
                      </span>
                      <Input
                        value={editedExpense?.editedAmount || ''}
                        onChange={(e) => setEditedExpenses(prev => ({
                          ...prev,
                          [expense.id]: {
                            ...editedExpense!,
                            editedAmount: e.target.value
                          }
                        }))}
                        className="pl-8"
                        data-testid={`input-amount-${expense.id}`}
                      />
                    </div>
                  ) : (
                    <p className="text-lg font-semibold">€{parseFloat(expense.amount).toFixed(2)}</p>
                  )}
                  {expense.originalAmount && expense.originalAmount !== expense.amount && (
                    <p className="text-xs text-gray-500">Original: {expense.originalAmount}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  {isEditing ? (
                    <Input
                      value={editedExpense?.editedDescription || ''}
                      onChange={(e) => setEditedExpenses(prev => ({
                        ...prev,
                        [expense.id]: {
                          ...editedExpense!,
                          editedDescription: e.target.value
                        }
                      }))}
                      data-testid={`input-description-${expense.id}`}
                    />
                  ) : (
                    <p>{expense.description}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Category</Label>
                  {isEditing ? (
                    <Select
                      value={editedExpense?.editedCategoryId || ''}
                      onValueChange={(value) => setEditedExpenses(prev => ({
                        ...prev,
                        [expense.id]: {
                          ...editedExpense!,
                          editedCategoryId: value
                        }
                      }))}
                    >
                      <SelectTrigger data-testid={`select-category-${expense.id}`}>
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
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>{category?.emoji}</span>
                      <span>{category?.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Partner</Label>
                  {isEditing ? (
                    <Select
                      value={editedExpense?.editedPartnerId || ''}
                      onValueChange={(value) => setEditedExpenses(prev => ({
                        ...prev,
                        [expense.id]: {
                          ...editedExpense!,
                          editedPartnerId: value
                        }
                      }))}
                    >
                      <SelectTrigger data-testid={`select-partner-${expense.id}`}>
                        <SelectValue placeholder="Select partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: partner.color }}
                              />
                              <span>{partner.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: partner?.color }}
                      />
                      <span>{partner?.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-600">Date</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedExpense?.editedDate || ''}
                    onChange={(e) => setEditedExpenses(prev => ({
                      ...prev,
                      [expense.id]: {
                        ...editedExpense!,
                        editedDate: e.target.value
                      }
                    }))}
                    data-testid={`input-date-${expense.id}`}
                  />
                ) : (
                  <p>{expense.date ? format(new Date(expense.date), 'PPP') : 'No date'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}