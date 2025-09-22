import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, CalendarIcon, User } from "lucide-react";
import type { Category, Expense, Partner } from "@shared/schema";
import { useDateRange } from "@/contexts/date-range-context";
import { format, isValid } from "date-fns";

interface CategoryExpensesProps {
  category: Category;
  onClose: () => void;
}

export default function CategoryExpenses({ category, onClose }: CategoryExpensesProps) {
  const { startDate, endDate } = useDateRange();
  
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  // Filter expenses by category and date range
  const filteredExpenses = expenses.filter((expense: Expense) => {
    if (!expense || !expense.date || expense.categoryId !== category.id) return false;
    const expenseDate = new Date(expense.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });

  // Sort by date (newest first)
  const sortedExpenses = filteredExpenses.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  const getPartner = (partnerId: string) => {
    return partners.find(p => p.id === partnerId);
  };

  const totalSpent = filteredExpenses.reduce((sum: number, expense: Expense) => {
    if (!expense || !expense.amount) return sum;
    const amount = parseFloat(expense.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span className="text-xl">{category.emoji}</span>
            <span>{category.name} Expenses</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-category">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
          </span>
          <span className="font-medium">
            Total: €{totalSpent.toFixed(2)} ({sortedExpenses.length} transactions)
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {sortedExpenses.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">{category.emoji}</span>
            <p className="text-muted-foreground">No expenses found for {category.name} in the selected period.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedExpenses.map((expense: Expense, index: number) => {
              const partner = getPartner(expense.partnerId);
              const expenseDate = expense.date ? new Date(expense.date) : null;
              
              return (
                <div 
                  key={expense.id || index} 
                  className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  data-testid={`expense-item-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {expense.description || "No description"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                          {expenseDate && isValid(expenseDate) && (
                            <span className="flex items-center space-x-1 flex-shrink-0">
                              <CalendarIcon className="h-3 w-3" />
                              <span>{format(expenseDate, 'MMM d, yyyy')}</span>
                            </span>
                          )}
                          {partner && (
                            <span className="flex items-center space-x-1 flex-shrink-0">
                              <User className="h-3 w-3" />
                              <span>{partner.name}</span>
                            </span>
                          )}
                          {expense.sourceLabel && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {expense.sourceLabel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right min-w-[80px]">
                      <p className="text-sm font-semibold text-foreground">
                        €{parseFloat(expense.amount || "0").toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}