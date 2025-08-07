import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import type { Category, Expense } from "@shared/schema";

export default function BudgetAlerts() {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: expenses = [] } = useQuery<(Expense & { category: Category; partner: any })[]>({
    queryKey: ["/api/expenses"],
  });

  // Calculate spending per category for current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = expenses.filter((expense: any) => {
    if (!expense || !expense.date) return false;
    return new Date(expense.date).toISOString().slice(0, 7) === currentMonth;
  });

  const categoryAlerts = categories.map((category: Category) => {
    if (!category) return null;
    
    const spent = monthlyExpenses
      .filter((expense: any) => expense && expense.categoryId === category.id)
      .reduce((sum: number, expense: any) => {
        if (!expense || !expense.amount) return sum;
        const amount = parseFloat(expense.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    
    const budget = parseFloat(category.budget || "0");
    if (budget <= 0) return null;
    
    const percentage = (spent / budget) * 100;
    const remaining = budget - spent;
    
    let alertType: 'warning' | 'danger' | 'success' | 'info' = 'success';
    let icon = CheckCircle;
    let message = '';
    
    if (percentage >= 100) {
      alertType = 'danger';
      icon = AlertTriangle;
      message = `Over budget by $${Math.abs(remaining).toFixed(2)}`;
    } else if (percentage >= 80) {
      alertType = 'warning';
      icon = TrendingUp;
      message = `${(100 - percentage).toFixed(1)}% budget remaining`;
    } else if (percentage >= 50) {
      alertType = 'info';
      icon = TrendingUp;
      message = `${(100 - percentage).toFixed(1)}% budget remaining`;
    } else {
      alertType = 'success';
      icon = CheckCircle;
      message = `Well within budget`;
    }
    
    return {
      category,
      spent,
      budget,
      percentage,
      remaining,
      alertType,
      icon,
      message
    };
  }).filter(Boolean);

  // Filter to show only categories that need attention
  const alertsToShow = categoryAlerts.filter((alert: any) => 
    alert && (alert.percentage >= 50 || alert.alertType === 'danger')
  );

  if (alertsToShow.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Budget Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All budgets are on track!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span>Budget Alerts</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertsToShow.map((alert: any) => {
          const Icon = alert.icon;
          return (
            <Alert key={alert.category.id} className={`
              ${alert.alertType === 'danger' ? 'border-red-200 bg-red-50' : ''}
              ${alert.alertType === 'warning' ? 'border-amber-200 bg-amber-50' : ''}
              ${alert.alertType === 'info' ? 'border-blue-200 bg-blue-50' : ''}
            `}>
              <div className="flex items-start space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{alert.category.emoji}</span>
                  <Icon className={`h-4 w-4 ${
                    alert.alertType === 'danger' ? 'text-red-600' : 
                    alert.alertType === 'warning' ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{alert.category.name}</span>
                    <span className="text-sm font-medium">
                      ${alert.spent.toFixed(2)} / ${alert.budget.toFixed(2)}
                    </span>
                  </div>
                  <AlertDescription className="text-xs">
                    {alert.message}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}