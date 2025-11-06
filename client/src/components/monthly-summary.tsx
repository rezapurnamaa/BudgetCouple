import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import type { Expense, Category, Partner } from "@shared/schema";

export default function MonthlySummary() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  // Filter expenses by selected month
  const monthlyExpenses = expenses.filter(expense => {
    if (!expense || !expense.date) return false;
    const expenseMonth = new Date(expense.date).toISOString().slice(0, 7);
    return expenseMonth === selectedMonth;
  });

  // Calculate monthly totals
  const monthlyTotal = monthlyExpenses.reduce((sum, expense) => {
    if (!expense || !expense.amount) return sum;
    const amount = parseFloat(expense.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Calculate partner spending
  const partnerSpending = partners.map(partner => {
    if (!partner) return { partner, total: 0 };
    
    const total = monthlyExpenses
      .filter(expense => expense && expense.partnerId === partner.id)
      .reduce((sum, expense) => {
        if (!expense || !expense.amount) return sum;
        const amount = parseFloat(expense.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    
    return { partner, total };
  });

  // Calculate category breakdown
  const categoryBreakdown = categories.map(category => {
    if (!category) return { category, total: 0, count: 0 };
    
    const categoryExpenses = monthlyExpenses.filter(expense => 
      expense && expense.categoryId === category.id
    );
    
    const total = categoryExpenses.reduce((sum, expense) => {
      if (!expense || !expense.amount) return sum;
      const amount = parseFloat(expense.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    return { category, total, count: categoryExpenses.length };
  }).filter(item => item.total > 0);

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Monthly Summary</span>
          </CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Monthly Total */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="text-3xl font-bold text-foreground">€{monthlyTotal.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">{monthlyExpenses.length} transactions</p>
        </div>

        {/* Partner Breakdown */}
        <div>
          <h4 className="font-medium mb-3">Partner Breakdown</h4>
          <div className="space-y-2">
            {partnerSpending.map(({ partner, total }) => (
              <div key={partner.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: partner.color }}
                  />
                  <span className="text-sm">{partner.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">€{total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {monthlyTotal > 0 ? ((total / monthlyTotal) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div>
          <h4 className="font-medium mb-3">Top Categories</h4>
          <div className="space-y-2">
            {categoryBreakdown
              .sort((a, b) => b.total - a.total)
              .slice(0, 5)
              .map(({ category, total, count }) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{category.emoji}</span>
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{count} transactions</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}