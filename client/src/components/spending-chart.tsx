import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDateRange } from "@/contexts/date-range-context";
import type { Expense, Category } from "@shared/schema";
import type { DateRange } from "react-day-picker";

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
  const {
    dateRange,
    setDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    startDate,
    endDate,
    dayCount,
    budgetMultiplier
  } = useDateRange();
  
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Date range now comes from context

  // Filter expenses by date range and calculate spending data with proportional budgets
  const { chartData, totalSpent, totalBudget, filteredExpenses } = useMemo(() => {
    const filteredExpenses = expenses.filter((expense) => {
      if (!expense?.date) return false;
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    const spendingData: SpendingData[] = categories
      .map((category) => {
        if (!category) return null;

        const spent = filteredExpenses
          .filter((expense) => expense?.categoryId === category.id)
          .reduce((sum: number, expense) => {
            if (!expense?.amount) return sum;
            const amount = parseFloat(expense.amount);
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);

        // Calculate proportional budget for the selected date range
        const monthlyBudget = category.budget ? parseFloat(category.budget) : 0;
        const budget = monthlyBudget * budgetMultiplier;
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
      filteredExpenses,
    };
  }, [expenses, categories, startDate, endDate, budgetMultiplier]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: SpendingData = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {data.emoji} {data.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Spent: €{data.value.toFixed(2)}
          </p>
          {data.budget > 0 && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Budget: €{data.budget.toFixed(2)}
              </p>
              <p className={`text-sm font-medium ${
                data.isOverBudget 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {data.isOverBudget 
                  ? `Over by €${(data.value - data.budget).toFixed(2)}` 
                  : `€${data.remaining.toFixed(2)} remaining`
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
          <div className="flex items-center space-x-2">
            <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30-days">Last 30 Days</SelectItem>
                <SelectItem value="60-days">Last 60 Days</SelectItem>
                <SelectItem value="90-days">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {dateRange === "custom" && (
          <div className="flex items-center space-x-2 mt-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !customStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customStartDate ? format(customStartDate, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-sm text-muted-foreground">to</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !customEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customEndDate ? format(customEndDate, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
        
        {/* Date Range and Budget Summary */}
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')} ({dayCount} days)
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Budget: €{totalBudget.toFixed(2)} ({(dayCount / 30).toFixed(2)}x monthly)
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-4">
              <span className="text-gray-900 dark:text-gray-100 font-semibold">
                Total Spent: €{totalSpent.toFixed(2)}
              </span>
            </div>
            <div className={`font-semibold ${
              budgetRemaining >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {budgetRemaining >= 0 
                ? `€${budgetRemaining.toFixed(2)} remaining` 
                : `€${overBudgetAmount.toFixed(2)} over budget`
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
      <CardContent className="pb-6">
        <div className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={90}
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
                  height={60}
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '12px',
                    lineHeight: '1.2'
                  }}
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.color, fontSize: '12px' }}>
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
