import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function CategoryBudgets() {
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
  });

  // Calculate spending per category
  const categorySpending = categories.map(category => {
    const spent = expenses
      .filter(expense => expense.categoryId === category.id)
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    const budget = parseFloat(category.budget || "0");
    const remaining = budget - spent;
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    
    return {
      ...category,
      spent,
      budget,
      remaining,
      percentage,
      isOverBudget: spent > budget && budget > 0,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Budgets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {categorySpending.map((category) => (
            <div key={category.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{category.emoji}</span>
                  <div>
                    <p className="font-medium text-foreground">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${category.spent.toFixed(2)} / ${category.budget.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {category.isOverBudget ? (
                    <p className="text-sm font-medium text-red-600">
                      ${Math.abs(category.remaining).toFixed(2)} over
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-green-600">
                      ${category.remaining.toFixed(2)} left
                    </p>
                  )}
                </div>
              </div>
              <Progress 
                value={category.percentage} 
                className="h-2"
                style={{
                  backgroundColor: '#e5e7eb',
                }}
              />
              <style jsx>{`
                .progress-bar {
                  background-color: ${category.isOverBudget ? '#ef4444' : category.color};
                }
              `}</style>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
