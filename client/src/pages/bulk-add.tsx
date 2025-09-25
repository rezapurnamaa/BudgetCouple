import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { insertExpenseSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { normalizeAmount, toISODate } from "@/lib/expense-utils";
import { z } from "zod";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Plus, 
  Trash2, 
  Copy, 
  RotateCcw,
  Save,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout";
import type { Category, Partner } from "@shared/schema";

// Schema for individual bulk expense items
const bulkExpenseItemSchema = insertExpenseSchema.omit({ date: true }).extend({
  id: z.string(), // Local ID for tracking
  date: z.date(),
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(
      /^-?[0-9]+([.,][0-9]{1,2})?$/,
      "Please enter a valid amount (e.g., 10.50, -5.00 for refunds)",
    ),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Please select a category"),
  partnerId: z.string().min(1, "Please select who paid"),
});

const bulkExpenseSchema = z.object({
  expenses: z.array(bulkExpenseItemSchema),
  defaults: z.object({
    date: z.date(),
    categoryId: z.string(),
    partnerId: z.string(),
  })
});

type BulkExpenseForm = z.infer<typeof bulkExpenseSchema>;
type BulkExpenseItem = z.infer<typeof bulkExpenseItemSchema>;

interface ExpenseSubmissionResult {
  id: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

function BulkAddContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submissionResults, setSubmissionResults] = useState<Record<string, ExpenseSubmissionResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  const form = useForm<BulkExpenseForm>({
    resolver: zodResolver(bulkExpenseSchema),
    defaultValues: {
      expenses: [
        {
          id: crypto.randomUUID(),
          amount: "",
          description: "",
          categoryId: "",
          partnerId: "",
          date: new Date(),
          sourceLabel: "",
        }
      ],
      defaults: {
        date: new Date(),
        categoryId: "",
        partnerId: "",
      }
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "expenses",
  });

  const addRow = () => {
    const defaults = form.getValues("defaults");
    append({
      id: crypto.randomUUID(),
      amount: "",
      description: "",
      categoryId: defaults.categoryId,
      partnerId: defaults.partnerId,
      date: defaults.date,
      sourceLabel: "",
    });
  };

  const addMultipleRows = (count: number) => {
    const defaults = form.getValues("defaults");
    for (let i = 0; i < count; i++) {
      append({
        id: crypto.randomUUID(),
        amount: "",
        description: "",
        categoryId: defaults.categoryId,
        partnerId: defaults.partnerId,
        date: defaults.date,
        sourceLabel: "",
      });
    }
  };

  const duplicateRow = (index: number) => {
    const expense = form.getValues(`expenses.${index}`);
    append({
      ...expense,
      id: crypto.randomUUID(),
      description: `${expense.description} (copy)`,
    });
  };

  const clearAll = () => {
    form.setValue("expenses", [{
      id: crypto.randomUUID(),
      amount: "",
      description: "",
      categoryId: "",
      partnerId: "",
      date: new Date(),
      sourceLabel: "",
    }]);
    setSubmissionResults({});
  };

  const submitExpensesMutation = useMutation({
    mutationFn: async (expenses: BulkExpenseItem[]) => {
      const results: Record<string, ExpenseSubmissionResult> = {};
      
      // Initialize all as pending
      expenses.forEach(expense => {
        results[expense.id] = { id: expense.id, status: 'pending' };
      });
      setSubmissionResults(results);

      // Submit expenses in batches of 3 for performance
      const batchSize = 3;
      for (let i = 0; i < expenses.length; i += batchSize) {
        const batch = expenses.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (expense) => {
            try {
              await apiRequest("/api/expenses", {
                method: "POST",
                body: {
                  amount: parseFloat(normalizeAmount(expense.amount)).toFixed(2),
                  description: expense.description,
                  categoryId: expense.categoryId,
                  partnerId: expense.partnerId,
                  date: toISODate(expense.date),
                  sourceLabel: expense.sourceLabel || "",
                },
              });
              results[expense.id] = { id: expense.id, status: 'success' };
            } catch (error: any) {
              results[expense.id] = { 
                id: expense.id, 
                status: 'error', 
                error: error.message || 'Failed to save expense'
              };
            }
          })
        );
        
        // Update results after each batch
        setSubmissionResults({ ...results });
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = Object.values(results).filter(r => r.status === 'success').length;
      const errorCount = Object.values(results).filter(r => r.status === 'error').length;
      
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      
      toast({
        title: "Bulk Save Complete",
        description: `${successCount} expenses saved${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save expenses",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: BulkExpenseForm) => {
    const validExpenses = data.expenses.filter(expense => 
      expense.amount && expense.description && expense.categoryId && expense.partnerId
    );

    if (validExpenses.length === 0) {
      toast({
        title: "No Valid Expenses",
        description: "Please add at least one complete expense",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await submitExpensesMutation.mutateAsync(validExpenses);
    setIsSubmitting(false);
  };

  const retryFailed = async () => {
    const failedExpenses = form.getValues("expenses").filter(expense => 
      submissionResults[expense.id]?.status === 'error' &&
      expense.amount && expense.description && expense.categoryId && expense.partnerId
    );

    if (failedExpenses.length === 0) return;

    setIsSubmitting(true);
    await submitExpensesMutation.mutateAsync(failedExpenses);
    setIsSubmitting(false);
  };

  const getRowStatus = (expenseId: string) => {
    return submissionResults[expenseId]?.status || null;
  };

  const getRowError = (expenseId: string) => {
    return submissionResults[expenseId]?.error;
  };

  const validExpensesCount = form.watch("expenses").filter(expense => 
    expense.amount && expense.description && expense.categoryId && expense.partnerId
  ).length;

  const failedCount = Object.values(submissionResults).filter(r => r.status === 'error').length;
  const successCount = Object.values(submissionResults).filter(r => r.status === 'success').length;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Defaults Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default Values</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Default Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("defaults.date") && "text-muted-foreground"
                      )}
                      data-testid="button-default-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("defaults.date") 
                        ? format(form.watch("defaults.date"), "PPP") 
                        : "Pick a date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("defaults.date")}
                      onSelect={(date) => date && form.setValue("defaults.date", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label>Default Category</Label>
                <Select
                  value={form.watch("defaults.categoryId")}
                  onValueChange={(value) => form.setValue("defaults.categoryId", value)}
                >
                  <SelectTrigger data-testid="select-default-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.emoji} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Default Partner</Label>
                <Select
                  value={form.watch("defaults.partnerId")}
                  onValueChange={(value) => form.setValue("defaults.partnerId", value)}
                >
                  <SelectTrigger data-testid="select-default-partner">
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
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={addRow}
              data-testid="button-add-row"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => addMultipleRows(5)}
              data-testid="button-add-5-rows"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add 5 Rows
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={clearAll}
              className="text-red-600 hover:text-red-700"
              data-testid="button-clear-all"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
            {failedCount > 0 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={retryFailed}
                disabled={isSubmitting}
                data-testid="button-retry-failed"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry Failed ({failedCount})
              </Button>
            )}
          </div>

          {/* Expenses Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[200px]">Description</TableHead>
                      <TableHead className="w-[120px]">Amount (€)</TableHead>
                      <TableHead className="w-[150px]">Category</TableHead>
                      <TableHead className="w-[120px]">Partner</TableHead>
                      <TableHead className="w-[120px]">Source</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const status = getRowStatus(field.id);
                      const error = getRowError(field.id);
                      
                      return (
                        <TableRow 
                          key={field.id} 
                          className={cn(
                            status === 'success' && "bg-green-50",
                            status === 'error' && "bg-red-50"
                          )}
                        >
                          <TableCell>
                            {status === 'success' && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                            {status === 'error' && (
                              <div title={error}>
                                <X className="h-4 w-4 text-red-600" />
                              </div>
                            )}
                            {status === 'pending' && (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-left font-normal"
                                  disabled={status === 'success'}
                                  data-testid={`button-date-${index}`}
                                >
                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                  {form.watch(`expenses.${index}.date`) 
                                    ? format(form.watch(`expenses.${index}.date`), "dd/MM") 
                                    : "Date"
                                  }
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={form.watch(`expenses.${index}.date`)}
                                  onSelect={(date) => date && form.setValue(`expenses.${index}.date`, date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </TableCell>

                          <TableCell>
                            <Input
                              {...form.register(`expenses.${index}.description`)}
                              placeholder="Expense description"
                              className="min-w-[200px]"
                              disabled={status === 'success'}
                              data-testid={`input-description-${index}`}
                            />
                            {form.formState.errors.expenses?.[index]?.description && (
                              <p className="text-red-500 text-xs mt-1">
                                {form.formState.errors.expenses[index]?.description?.message}
                              </p>
                            )}
                          </TableCell>

                          <TableCell>
                            <Input
                              {...form.register(`expenses.${index}.amount`)}
                              placeholder="10,50"
                              className="w-[120px]"
                              disabled={status === 'success'}
                              data-testid={`input-amount-${index}`}
                            />
                            {form.formState.errors.expenses?.[index]?.amount && (
                              <p className="text-red-500 text-xs mt-1">
                                {form.formState.errors.expenses[index]?.amount?.message}
                              </p>
                            )}
                          </TableCell>

                          <TableCell>
                            <Select
                              value={form.watch(`expenses.${index}.categoryId`)}
                              onValueChange={(value) => form.setValue(`expenses.${index}.categoryId`, value)}
                              disabled={status === 'success'}
                            >
                              <SelectTrigger className="w-[150px]" data-testid={`select-category-${index}`}>
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.emoji} {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.expenses?.[index]?.categoryId && (
                              <p className="text-red-500 text-xs mt-1">
                                {form.formState.errors.expenses[index]?.categoryId?.message}
                              </p>
                            )}
                          </TableCell>

                          <TableCell>
                            <Select
                              value={form.watch(`expenses.${index}.partnerId`)}
                              onValueChange={(value) => form.setValue(`expenses.${index}.partnerId`, value)}
                              disabled={status === 'success'}
                            >
                              <SelectTrigger className="w-[120px]" data-testid={`select-partner-${index}`}>
                                <SelectValue placeholder="Partner" />
                              </SelectTrigger>
                              <SelectContent>
                                {partners.map((partner) => (
                                  <SelectItem key={partner.id} value={partner.id}>
                                    <div className="flex items-center space-x-2">
                                      <div 
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: partner.color }}
                                      />
                                      <span>{partner.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.expenses?.[index]?.partnerId && (
                              <p className="text-red-500 text-xs mt-1">
                                {form.formState.errors.expenses[index]?.partnerId?.message}
                              </p>
                            )}
                          </TableCell>

                          <TableCell>
                            <Select
                              value={form.watch(`expenses.${index}.sourceLabel`) || "none"}
                              onValueChange={(value) => form.setValue(`expenses.${index}.sourceLabel`, value === "none" ? "" : value)}
                              disabled={status === 'success'}
                            >
                              <SelectTrigger className="w-[120px]" data-testid={`select-source-${index}`}>
                                <SelectValue placeholder="Source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="AMEX">AMEX</SelectItem>
                                <SelectItem value="DKB">DKB Bank</SelectItem>
                                <SelectItem value="Chase">Chase Bank</SelectItem>
                                <SelectItem value="PayPal">PayPal</SelectItem>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Other Card">Other Card</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => duplicateRow(index)}
                                disabled={status === 'success'}
                                data-testid={`button-duplicate-${index}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1 || status === 'success'}
                                data-testid={`button-remove-${index}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Footer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>Total rows: {fields.length}</span>
                  <span>Ready to save: {validExpensesCount}</span>
                  {successCount > 0 && (
                    <span className="text-green-600">✓ Saved: {successCount}</span>
                  )}
                  {failedCount > 0 && (
                    <span className="text-red-600">✗ Failed: {failedCount}</span>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={validExpensesCount === 0 || isSubmitting}
                  data-testid="button-save-expenses"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Saving..." : `Save ${validExpensesCount} Expenses`}
                </Button>
              </div>
            </CardContent>
          </Card>
    </form>
  );
}

export default function BulkAdd() {
  return (
    <Layout 
      title="Bulk Add Expenses" 
      description="Add multiple expenses at once for quick catch-up on your spending"
    >
      <BulkAddContent />
    </Layout>
  );
}