import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, CreditCard, PiggyBank, Receipt } from "lucide-react";
import QuickAddExpense from "@/components/quick-add-expense";
import ExpenseHistory from "@/components/expense-history";
import CategoryBudgets from "@/components/category-budgets";
import SpendingChart from "@/components/spending-chart";
import BottomNavigation from "@/components/bottom-navigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardStats {
  totalSpent: number;
  budgetRemaining: number;
  transactionCount: number;
}

export default function Dashboard() {
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

  // Calculate dashboard stats with defensive checks
  const totalSpent = expenses.reduce((sum, expense) => {
    if (!expense || !expense.amount) return sum;
    const amount = parseFloat(expense.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const totalBudget = categories.reduce((sum, cat) => {
    if (!cat || !cat.budget) return sum;
    const budget = parseFloat(cat.budget);
    return sum + (isNaN(budget) ? 0 : budget);
  }, 0);
  
  const budgetRemaining = totalBudget - totalSpent;
  const transactionCount = expenses.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">CoupleFinance</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Partner indicators */}
              <div className="flex items-center space-x-2">
                {partners.map((partner) => (
                  <div key={partner.id} className="flex items-center space-x-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: partner.color }}
                    />
                    <span className="text-sm text-muted-foreground">{partner.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Dashboard Stats and Chart */}
          <div className="lg:col-span-2">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${totalSpent.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">This month</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Budget Left</p>
                      <p className={`text-2xl font-bold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(budgetRemaining).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {budgetRemaining >= 0 ? 'Remaining' : 'Over budget'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <PiggyBank className="text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold text-foreground">{transactionCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">This month</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Receipt className="text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Add Expense */}
            <QuickAddExpense />
            
            {/* Spending Chart */}
            <SpendingChart />
          </div>
          
          {/* Categories */}
          <div className="space-y-6">
            <CategoryBudgets />
          </div>
        </div>

        {/* Expense History */}
        <ExpenseHistory />
      </div>

      {/* Mobile Bottom Navigation with extra padding for iOS */}
      {isMobile && (
        <>
          <div className="h-20"></div>
          <BottomNavigation />
        </>
      )}
    </div>
  );
}
