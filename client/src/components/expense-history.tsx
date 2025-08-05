import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function ExpenseHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["/api/partners"],
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.categoryId === categoryFilter;
    const matchesPartner = partnerFilter === "all" || expense.partnerId === partnerFilter;
    
    return matchesSearch && matchesCategory && matchesPartner;
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading expenses...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle>Recent Transactions</CardTitle>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={partnerFilter} onValueChange={setPartnerFilter}>
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder="Both Partners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Both Partners</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="relative">
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {expenses.length === 0 ? "No expenses yet. Add your first expense above!" : "No expenses match your filters."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="py-4 hover:bg-muted/50 transition-colors rounded-lg px-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${expense.category.color}20` }}
                    >
                      {expense.category.emoji}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{expense.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant="secondary"
                          style={{ 
                            backgroundColor: `${expense.category.color}20`,
                            color: expense.category.color,
                          }}
                        >
                          {expense.category.name}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: expense.partner.color }}
                          />
                          <span className="text-sm text-muted-foreground">{expense.partner.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <div>
                      <p className="font-semibold text-foreground">-${parseFloat(expense.amount).toFixed(2)}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deleteExpenseMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
