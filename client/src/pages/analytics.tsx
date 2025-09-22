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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import {
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  PieChart as PieChartIcon,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";
import MonthlySummary from "@/components/monthly-summary";
import BudgetAlerts from "@/components/budget-alerts";
import BottomNavigation from "@/components/bottom-navigation";
import DesktopNavigation from "@/components/desktop-navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { DateRangeProvider, useDateRange } from "@/contexts/date-range-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

function AnalyticsContent() {
  const [timeRange, setTimeRange] = useState("6months");
  const isMobile = useIsMobile();
  const { startDate, endDate, setCustomDateRange } = useDateRange();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["/api/partners"],
  });

  // Filter expenses by date range
  const filteredExpenses = expenses.filter((expense) => {
    if (!expense || !expense.date) return false;
    const expenseDate = new Date(expense.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });

  // Generate spending data for the selected date range (by week or month based on range)
  const daysDifference = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const showWeeklyData = daysDifference <= 60; // Show weekly for 2 months or less, monthly for longer periods

  // Determine chart title based on specific date ranges
  const getChartTitle = () => {
    if (daysDifference <= 7) {
      return "Weekly Spending Trend";
    } else if (daysDifference <= 30) {
      return "Monthly Spending Trend";
    } else {
      return "Spending Trend";
    }
  };

  const timeSeriesData = showWeeklyData
    ? // Weekly data
      Array.from({ length: Math.ceil(daysDifference / 7) }, (_, i) => {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekExpenses = filteredExpenses.filter((expense) => {
          if (!expense || !expense.date) return false;
          const expenseDate = new Date(expense.date);
          return expenseDate >= weekStart && expenseDate <= weekEnd;
        });

        const total = weekExpenses.reduce((sum, expense) => {
          if (!expense || !expense.amount) return sum;
          const amount = parseFloat(expense.amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        return {
          period: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`,
          total: total,
          transactions: weekExpenses.length,
        };
      })
    : // Monthly data - generate months for the selected date range
      (() => {
        const months = [];
        const current = new Date(startDate);
        current.setDate(1); // Start at beginning of month

        while (current <= endDate) {
          const monthStart = new Date(current);
          const monthEnd = new Date(
            current.getFullYear(),
            current.getMonth() + 1,
            0,
          ); // Last day of month

          const monthExpenses = filteredExpenses.filter((expense) => {
            if (!expense || !expense.date) return false;
            const expenseDate = new Date(expense.date);
            return expenseDate >= monthStart && expenseDate <= monthEnd;
          });

          const total = monthExpenses.reduce((sum, expense) => {
            if (!expense || !expense.amount) return sum;
            const amount = parseFloat(expense.amount);
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);

          months.push({
            period: current.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            total: total,
            transactions: monthExpenses.length,
          });

          current.setMonth(current.getMonth() + 1);
        }

        return months;
      })();

  // Category spending comparison (filtered by date range)
  const categoryComparison = categories
    .map((category) => {
      if (!category) return null;

      const spent = filteredExpenses
        .filter((expense) => expense && expense.categoryId === category.id)
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
        budgetColor: "#E5E7EB",
      };
    })
    .filter(Boolean);

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
              <h1 className="text-xl font-semibold text-foreground">
                Analytics
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <DesktopNavigation />

              {/* Date Range Controls */}
              <div className="flex items-center space-x-2">
                {/* Quick Preset Buttons */}
                <div className="hidden sm:flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const end = new Date();
                      const start = subDays(end, 6);
                      setCustomDateRange(start, end);
                    }}
                  >
                    7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const end = new Date();
                      const start = subDays(end, 29);
                      setCustomDateRange(start, end);
                    }}
                  >
                    30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const end = endOfMonth(new Date());
                      const start = startOfMonth(new Date());
                      setCustomDateRange(start, end);
                    }}
                  >
                    This month
                  </Button>
                </div>

                {/* Custom Date Range Picker */}
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <CalendarDays className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {format(startDate, "MMM d")} -{" "}
                        {format(endDate, "MMM d, yyyy")}
                      </span>
                      <span className="sm:hidden">
                        {format(startDate, "M/d")} - {format(endDate, "M/d")}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      defaultMonth={startDate}
                      selected={{ from: startDate, to: endDate }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setCustomDateRange(range.from, range.to);
                          setIsCalendarOpen(false);
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
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
                  <span>{getChartTitle()}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "MMM d")} -{" "}
                  {format(endDate, "MMM d, yyyy")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData}>
                      <defs>
                        <linearGradient
                          id="colorGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3B82F6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3B82F6"
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `€${value}`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(
                          value: number,
                          name: string,
                          props: any,
                        ) => [`€${value.toFixed(2)}`, "Total Spent"]}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, fill: "#1D4ED8", strokeWidth: 0 }}
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
                  <CalendarIcon className="h-5 w-5" />
                  <span>Budget vs Actual Spending</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "MMM d")} -{" "}
                  {format(endDate, "MMM d, yyyy")}
                </p>
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
                        tickFormatter={(value) => `€${value}`}
                      />
                      <Tooltip
                        formatter={(
                          value: number,
                          name: string,
                          props: any,
                        ) => {
                          const isSpent = name === "spent";
                          const category = categoryComparison.find(
                            (c) => c.name === props.payload?.name,
                          );
                          if (!category) return [`€${value.toFixed(2)}`, name];

                          const isOverBudget =
                            category.spent > category.budget &&
                            category.budget > 0;
                          const isEqualBudget =
                            category.spent === category.budget &&
                            category.budget > 0;

                          if (isSpent) {
                            if (isOverBudget) {
                              const overAmount =
                                category.spent - category.budget;
                              return [
                                `€${value.toFixed(2)}`,
                                `Spent (Over by €${overAmount.toFixed(2)}!)`,
                              ];
                            } else if (isEqualBudget) {
                              return [
                                `€${value.toFixed(2)}`,
                                "Spent (0% budget remaining)",
                              ];
                            } else {
                              const remaining =
                                category.budget - category.spent;
                              const remainingPercent =
                                category.budget > 0
                                  ? (
                                      (remaining / category.budget) *
                                      100
                                    ).toFixed(0)
                                  : "0";
                              return [
                                `€${value.toFixed(2)}`,
                                `Spent (${remainingPercent}% budget remaining)`,
                              ];
                            }
                          }
                          return [`€${value.toFixed(2)}`, "Budget"];
                        }}
                        labelStyle={{ color: "#374151" }}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="budget"
                        fill="#E5E7EB"
                        name="budget"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar dataKey="spent" name="spent" radius={[2, 2, 0, 0]}>
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

export default function Analytics() {
  return (
    <DateRangeProvider>
      <AnalyticsContent />
    </DateRangeProvider>
  );
}
