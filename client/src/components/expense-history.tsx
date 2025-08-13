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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete all expenses in parallel
      const deletePromises = ids.map(id => 
        apiRequest("DELETE", `/api/expenses/${id}`)
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

  // Filter expenses with defensive checks
  const filteredExpenses = expenses.filter((expense) => {
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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          {filteredExpenses.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectionMode}
              className="flex items-center space-x-1 text-xs"
            >
              {isSelectionMode ? <Square className="h-3 w-3" /> : <CheckSquare className="h-3 w-3" />}
              <span>{isSelectionMode ? "Cancel" : "Select"}</span>
            </Button>
          )}
        </div>
        
        {/* Simplified filters for sidebar */}
        <div className="flex space-x-2 mt-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Category" />
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
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Partner" />
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
        </div>
        
        <div className="relative mt-2">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
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
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {expenses.length === 0 ? "No expenses yet" : "No matches"}
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {paginatedExpenses.map((expense) => {
                const category = categories.find(c => c.id === expense.categoryId);
                const partner = partners.find(p => p.id === expense.partnerId);
                
                return (
                  <div 
                    key={expense.id} 
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {isSelectionMode && (
                      <Checkbox
                        checked={selectedExpenses.includes(expense.id)}
                        onCheckedChange={() => handleSelectExpense(expense.id)}
                        className="mr-2"
                      />
                    )}
                    
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0" 
                           style={{ backgroundColor: category?.color || '#6B7280' }}>
                        <span className="text-white">{category?.emoji || '📝'}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">
                          {expense.description}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <span className="truncate">{category?.name || 'Unknown'}</span>
                          <span>•</span>
                          <span className="truncate" style={{ color: partner?.color || '#6B7280' }}>
                            {partner?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center space-x-1 flex-shrink-0">
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          ${expense.amount ? parseFloat(expense.amount).toFixed(2) : '0.00'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {expense.date ? format(new Date(expense.date), 'MMM d') : 'No date'}
                        </p>
                      </div>
                      
                      {!isSelectionMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          disabled={deleteExpenseMutation.isPending}
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compact Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-6 px-2 text-xs"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-6 px-2 text-xs"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentPage}/{totalPages} • {filteredExpenses.length} total
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
