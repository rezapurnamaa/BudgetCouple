import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDateRange } from "@/contexts/date-range-context";
import { format } from "date-fns";
import type { Expense, Category, BudgetPeriod } from "@shared/schema";

export default function CategoryBudgets() {
  const { startDate, endDate, budgetMultiplier } = useDateRange();
  
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: budgetPeriods = [] } = useQuery<BudgetPeriod[]>({
    queryKey: ["/api/budget-periods"],
  });

  // Calculate spending per category with date range filtering and budget period integration
  const categorySpending = categories.map((category) => {
    if (!category) return null;
    
    // Filter expenses by selected date range
    const filteredExpenses = expenses.filter((expense) => {
      if (!expense?.date || expense.categoryId !== category.id) return false;
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
    
    const spent = filteredExpenses.reduce((sum: number, expense) => {
      if (!expense || !expense.amount) return sum;
      const amount = parseFloat(expense.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    // Check for active budget periods that overlap with selected date range and match this category
    const activeBudgetPeriod = budgetPeriods.find((period) => {
      if (!period.isActive || period.categoryId !== category.id) return false;
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      
      // Check if the budget period overlaps with the selected date range
      return periodStart <= endDate && periodEnd >= startDate;
    });
    
    let budget: number;
    let budgetSource: string;
    
    if (activeBudgetPeriod) {
      // Use budget period amount if there's an active period for this category
      budget = parseFloat(activeBudgetPeriod.budgetAmount || "0");
      budgetSource = `Budget Period: ${activeBudgetPeriod.name}`;
    } else {
      // Fall back to proportional monthly budget
      const monthlyBudget = parseFloat(category.monthlyBudget || "0");
      budget = isNaN(monthlyBudget) ? 0 : monthlyBudget * budgetMultiplier;
      budgetSource = `Monthly Budget (${budgetMultiplier.toFixed(2)}x)`;
    }
    
    const remaining = budget - spent;
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    
    return {
      ...category,
      spent,
      budget,
      remaining,
      percentage,
      isOverBudget: spent > budget && budget > 0,
      budgetSource,
      usingBudgetPeriod: !!activeBudgetPeriod,
    };
  }).filter((item): item is Category & {
    spent: number;
    budget: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
    budgetSource: string;
    usingBudgetPeriod: boolean;
  } => item !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Budgets</CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {categorySpending.map((category) => (
            <div key={category.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{category.emoji}</span>
                  <div>
                    <p className="font-medium text-foreground flex items-center space-x-2">
                      <span>{category.name}</span>
                      {category.usingBudgetPeriod && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Period Budget
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      €{category.spent.toFixed(2)} / €{category.budget.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {category.isOverBudget ? (
                    <p className="text-sm font-medium text-red-600">
                      €{Math.abs(category.remaining).toFixed(2)} over
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-green-600">
                      €{category.remaining.toFixed(2)} left
                    </p>
                  )}
                </div>
              </div>
              <Progress 
                value={category.percentage} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
