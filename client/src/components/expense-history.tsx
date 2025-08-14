import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Edit, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ExpenseEditModal } from "@/components/expense-edit-modal";
import type { Expense, Category, Partner } from "@shared/schema";

const ITEMS_PER_PAGE = 10;

export default function ExpenseHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const { data: expenses = [], isLoading } = useQuery<(Expense & { category: Category; partner: Partner })[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/expenses/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete all expenses in parallel
      const deletePromises = ids.map(id => 
        apiRequest(`/api/expenses/${id}`, {
          method: "DELETE",
        })
      );
      return Promise.all(deletePromises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setSelectedExpenses([]);
      setIsSelectionMode(false);
      toast({
        title: "Success",
        description: `${variables.length} expenses deleted successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete some expenses",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateCategoryMutation = useMutation({
    mutationFn: async ({ ids, categoryId }: { ids: string[], categoryId: string }) => {
      // Update all expenses in parallel
      const updatePromises = ids.map(id => 
        apiRequest(`/api/expenses/${id}`, {
          method: "PATCH",
          body: { categoryId }
        })
      );
      return Promise.all(updatePromises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setSelectedExpenses([]);
      setIsSelectionMode(false);
      const category = categories.find(c => c.id === variables.categoryId);
      toast({
        title: "Success",
        description: `${variables.ids.length} expenses updated to ${category?.name || 'selected category'}`,
      });
    },
    onError: (error: any) => {
      console.error("Bulk update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update expenses",
        variant: "destructive",
      });
    },
  });

  // Filter expenses with defensive checks
  const filteredExpenses = expenses.filter((expense: Expense & { category: Category; partner: Partner }) => {
    if (!expense || !expense.description) return false;
    
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.categoryId === categoryFilter;
    const matchesPartner = partnerFilter === "all" || expense.partnerId === partnerFilter;
    
    return matchesSearch && matchesCategory && matchesPartner;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, partnerFilter]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedExpenses.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedExpenses.length} selected expenses?`)) {
      bulkDeleteMutation.mutate(selectedExpenses);
    }
  };

  const handleBulkCategoryUpdate = (categoryId: string) => {
    bulkUpdateCategoryMutation.mutate({ ids: selectedExpenses, categoryId });
  };

  const handleSelectExpense = (expenseId: string) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map(expense => expense.id));
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedExpenses([]);
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
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <CardTitle>Recent Transactions</CardTitle>
            {filteredExpenses.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectionMode}
                className="flex items-center space-x-2"
              >
                {isSelectionMode ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                <span>{isSelectionMode ? "Cancel" : "Select"}</span>
              </Button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: Category) => (
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
                {partners.map((partner: Partner) => (
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
        
        {/* Bulk actions bar */}
        {isSelectionMode && (
          <div className="flex items-center justify-between p-4 bg-muted/20 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedExpenses.length === 0 
                  ? "Select all" 
                  : `${selectedExpenses.length} selected`
                }
              </span>
            </div>
            
            {selectedExpenses.length > 0 && (
              <div className="flex items-center space-x-2">
                <Select onValueChange={handleBulkCategoryUpdate}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Change category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.emoji} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>
                    {bulkDeleteMutation.isPending 
                      ? "Deleting..." 
                      : `Delete ${selectedExpenses.length}`
                    }
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {expenses.length === 0 ? "No expenses yet. Add your first expense above!" : "No expenses match your filters."}
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {paginatedExpenses.map((expense: Expense & { category: Category; partner: Partner }) => {
                const category = categories.find((c: Category) => c.id === expense.categoryId);
                const partner = partners.find((p: Partner) => p.id === expense.partnerId);
                
                return (
                  <div key={expense.id} className="py-4 hover:bg-muted/50 transition-colors rounded-lg px-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {isSelectionMode && (
                          <Checkbox
                            checked={selectedExpenses.includes(expense.id)}
                            onCheckedChange={() => handleSelectExpense(expense.id)}
                          />
                        )}
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: category?.color ? `${category.color}20` : '#e5e7eb' }}
                        >
                          {category?.emoji || '📝'}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{expense.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {category && (
                              <Badge 
                                variant="secondary"
                                style={{ 
                                  backgroundColor: `${category.color}20`,
                                  color: category.color,
                                }}
                              >
                                {category.name}
                              </Badge>
                            )}
                            {partner && (
                              <div className="flex items-center space-x-1">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: partner.color }}
                                />
                                <span className="text-sm text-muted-foreground">{partner.name}</span>
                              </div>
                            )}
                            {expense.sourceLabel && (
                              <Badge variant="outline" className="text-xs">
                                {expense.sourceLabel}
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {expense.date ? format(new Date(expense.date), "MMM d, yyyy") : 'No date'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-2">
                        <div>
                          <p className="font-semibold text-foreground">
                            €{expense.amount ? parseFloat(expense.amount).toFixed(2) : '0.00'}
                          </p>
                        </div>
                        {!isSelectionMode && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingExpense(expense)}
                              data-testid={`button-edit-expense-${expense.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
                              disabled={deleteExpenseMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} • {filteredExpenses.length} total
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
    
    {editingExpense && (
      <ExpenseEditModal
        expense={editingExpense}
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
      />
    )}
  </>
  );
}
