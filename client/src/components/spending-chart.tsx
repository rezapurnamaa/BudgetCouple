import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function SpendingChart() {
  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Calculate spending by category
  const chartData = categories.map(category => {
    const spent = expenses
      .filter(expense => expense.categoryId === category.id)
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    return {
      name: category.name,
      value: spent,
      color: category.color,
      emoji: category.emoji,
    };
  }).filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">
            {data.emoji} {data.name}
          </p>
          <p className="text-sm text-muted-foreground">
            ${data.value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending by Category</CardTitle>
          <Select defaultValue="this-month">
            <SelectTrigger className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
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
              No spending data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
