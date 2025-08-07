import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { Calendar, TrendingUp, Users, PieChart as PieChartIcon } from "lucide-react";
import { useState } from "react";
import MonthlySummary from "@/components/monthly-summary";
import BudgetAlerts from "@/components/budget-alerts";
import BottomNavigation from "@/components/bottom-navigation";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("6months");
  const isMobile = useIsMobile();

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["/api/partners"],
  });

  // Generate monthly spending data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7);
    
    const monthExpenses = expenses.filter(expense => {
      if (!expense || !expense.date) return false;
      return new Date(expense.date).toISOString().slice(0, 7) === monthKey;
    });
    
    const total = monthExpenses.reduce((sum, expense) => {
      if (!expense || !expense.amount) return sum;
      const amount = parseFloat(expense.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      total: total,
      transactions: monthExpenses.length
    };
  }).reverse();

  // Category spending comparison
  const categoryComparison = categories.map(category => {
    if (!category) return null;
    
    const spent = expenses
      .filter(expense => expense && expense.categoryId === category.id)
      .reduce((sum, expense) => {
        if (!expense || !expense.amount) return sum;
        const amount = parseFloat(expense.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    
    const budget = parseFloat(category.budget || "0");
    const isOverBudget = spent > budget && budget > 0;
    
    return {
      name: category.name,
      spent: spent,
      budget: budget,
      emoji: category.emoji,
      spentColor: isOverBudget ? "#EF4444" : "#3B82F6",
      budgetColor: "#E5E7EB"
    };
  }).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <PieChartIcon className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
            </div>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Monthly Spending Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Monthly Spending Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `$${value.toFixed(2)}`, 
                          'Total Spent'
                        ]}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, fill: '#1D4ED8', strokeWidth: 0 }}
                        fill="url(#colorGradient)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Budget vs Actual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Budget vs Actual Spending</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => {
                          const isSpent = name === 'spent';
                          const category = categoryComparison.find(c => c.name === props.payload?.name);
                          const isOverBudget = category && category.spent > category.budget && category.budget > 0;
                          
                          return [
                            `$${value.toFixed(2)}`, 
                            isSpent ? (isOverBudget ? 'Spent (Over Budget!)' : 'Spent') : 'Budget'
                          ];
                        }}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="budget" 
                        fill="#E5E7EB" 
                        name="budget"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar 
                        dataKey="spent" 
                        name="spent"
                        radius={[2, 2, 0, 0]}
                      >
                        {categoryComparison.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.spentColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <BudgetAlerts />
            <MonthlySummary />
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMobile && <BottomNavigation />}
    </div>
  );
}