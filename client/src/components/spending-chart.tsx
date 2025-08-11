import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

type DateRange = "30-days" | "60-days" | "90-days" | "custom";

interface SpendingData {
  name: string;
  value: number;
  budget: number;
  color: string;
  emoji: string;
  remaining: number;
  isOverBudget: boolean;
}

export default function SpendingChart() {
  const [dateRange, setDateRange] = useState<DateRange>("30-days");
  
  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    
    switch (dateRange) {
      case "30-days":
        start = subDays(now, 30);
        break;
      case "60-days":
        start = subDays(now, 60);
        break;
      case "90-days":
        start = subDays(now, 90);
        break;
      default:
        start = subDays(now, 30);
    }
    
    return {
      startDate: startOfDay(start),
      endDate: endOfDay(now)
    };
  }, [dateRange]);

  // Filter expenses by date range and calculate spending data
  const { chartData, totalSpent, totalBudget } = useMemo(() => {
    const filteredExpenses = expenses.filter((expense: any) => {
      if (!expense?.date) return false;
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    const spendingData: SpendingData[] = categories
      .map((category: any) => {
        if (!category) return null;

        const spent = filteredExpenses
          .filter((expense: any) => expense?.categoryId === category.id)
          .reduce((sum: number, expense: any) => {
            if (!expense?.amount) return sum;
            const amount = parseFloat(expense.amount);
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);

        const budget = category.budget ? parseFloat(category.budget) : 0;
        const remaining = Math.max(0, budget - spent);
        const isOverBudget = spent > budget && budget > 0;

        return {
          name: category.name || "Unknown",
          value: spent,
          budget,
          remaining,
          isOverBudget,
          color: category.color || "#6B7280",
          emoji: category.emoji || "📝",
        };
      })
      .filter((item): item is SpendingData => item !== null && item.value > 0);

    const totalSpent = spendingData.reduce((sum, item) => sum + item.value, 0);
    const totalBudget = spendingData.reduce((sum, item) => sum + item.budget, 0);

    return {
      chartData: spendingData,
      totalSpent,
      totalBudget,
    };
  }, [expenses, categories, startDate, endDate]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: SpendingData = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {data.emoji} {data.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Spent: ${data.value.toFixed(2)}
          </p>
          {data.budget > 0 && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Budget: ${data.budget.toFixed(2)}
              </p>
              <p className={`text-sm font-medium ${
                data.isOverBudget 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {data.isOverBudget 
                  ? `Over by $${(data.value - data.budget).toFixed(2)}` 
                  : `${data.remaining.toFixed(2)} remaining`
                }
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  const budgetRemaining = totalBudget - totalSpent;
  const overBudgetAmount = totalSpent > totalBudget ? totalSpent - totalBudget : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending by Category</CardTitle>
          <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
            <SelectTrigger className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30-days">Last 30 Days</SelectItem>
              <SelectItem value="60-days">Last 60 Days</SelectItem>
              <SelectItem value="90-days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Range and Budget Summary */}
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Budget: ${totalBudget.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-4">
              <span className="text-gray-900 dark:text-gray-100 font-semibold">
                Total Spent: ${totalSpent.toFixed(2)}
              </span>
            </div>
            <div className={`font-semibold ${
              budgetRemaining >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {budgetRemaining >= 0 
                ? `${budgetRemaining.toFixed(2)} remaining` 
                : `${overBudgetAmount.toFixed(2)} over budget`
              }
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Budget Usage</span>
              <span>{totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  totalSpent > totalBudget 
                    ? 'bg-red-500' 
                    : totalSpent > totalBudget * 0.8 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`}
                style={{ 
                  width: totalBudget > 0 
                    ? `${Math.min((totalSpent / totalBudget) * 100, 100)}%` 
                    : '0%' 
                }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.color }}>
                      {entry.payload.emoji} {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No spending data for selected period
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
