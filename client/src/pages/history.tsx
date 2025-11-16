import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DesktopNavigation from "@/components/desktop-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useDateRange } from "@/contexts/date-range-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { DateRangeProvider } from "@/contexts/date-range-context";
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  DollarSign,
  User,
  Tag,
  ArrowUpDown,
  ChevronDown,
  Download,
  Eye,
  Settings,
  Trash2
} from "lucide-react";
import DateRangePicker from "@/components/date-range-picker";
import { format, parseISO, isValid } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function HistoryContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPartner, setSelectedPartner] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const itemsPerPage = 20;

  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { startDate, endDate } = useDateRange();
  const { toast } = useToast();

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["/api/partners"],
  });

  // Delete single expense mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/expenses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Expense deleted",
        description: "The expense has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiRequest("/api/expenses/bulk-delete", { method: "POST", body: { ids } });
      return response as { deletedCount: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Expenses deleted",
        description: `Successfully deleted ${data.deletedCount} expense${data.deletedCount !== 1 ? 's' : ''}.`,
      });
      setSelectedExpenseIds(new Set());
      setBulkDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete expenses. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Selection handlers
  const toggleExpenseSelection = (id: string) => {
    setSelectedExpenseIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedExpenseIds.size === paginatedExpenses.length && paginatedExpenses.length > 0) {
      setSelectedExpenseIds(new Set());
    } else {
      setSelectedExpenseIds(new Set(paginatedExpenses.map((e: any) => e.id)));
    }
  };

  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      deleteMutation.mutate(expenseToDelete);
    }
  };

  const confirmBulkDelete = () => {
    const idsArray = Array.from(selectedExpenseIds);
    bulkDeleteMutation.mutate(idsArray);
  };

  // Get unique source labels for filter dropdown
  const uniqueSources = Array.from(new Set(
    (expenses as any[])
      .map((e: any) => e.sourceLabel)
      .filter(Boolean)
  )).sort();

  // Filter expenses by date range, search term, category, partner, and source
  const filteredExpenses = (expenses as any[]).filter((expense: any) => {
    if (!expense || !expense.date) return false;
    
    const expenseDate = new Date(expense.date);
    const dateInRange = expenseDate >= startDate && expenseDate <= endDate;
    
    const matchesSearch = !searchTerm || 
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.amount?.toString().includes(searchTerm);
    
    const matchesCategory = selectedCategory === "all" || expense.categoryId === selectedCategory;
    const matchesPartner = selectedPartner === "all" || expense.partnerId === selectedPartner;
    const matchesSource = selectedSource === "all" || expense.sourceLabel === selectedSource;
    
    return dateInRange && matchesSearch && matchesCategory && matchesPartner && matchesSource;
  });

  // Sort expenses
  const sortedExpenses = [...filteredExpenses].sort((a: any, b: any) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case "date":
        aValue = new Date(a.date || 0).getTime();
        bValue = new Date(b.date || 0).getTime();
        break;
      case "amount":
        aValue = parseFloat(a.amount || "0");
        bValue = parseFloat(b.amount || "0");
        break;
      case "category":
        const aCat = (categories as any[]).find((c: any) => c.id === a.categoryId);
        const bCat = (categories as any[]).find((c: any) => c.id === b.categoryId);
        aValue = aCat?.name || "";
        bValue = bCat?.name || "";
        break;
      default:
        aValue = new Date(a.date || 0).getTime();
        bValue = new Date(b.date || 0).getTime();
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const paginatedExpenses = sortedExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum: number, expense: any) => {
    const amount = parseFloat(expense.amount || "0");
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const getCategory = (categoryId: string) => {
    return (categories as any[]).find((c: any) => c.id === categoryId);
  };

  const getPartner = (partnerId: string) => {
    return (partners as any[]).find((p: any) => p.id === partnerId);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedPartner("all");
    setSelectedSource("all");
    setSortBy("date");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <HistoryIcon className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Expense History</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <DesktopNavigation />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-xl font-semibold">€{totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-xl font-semibold">{filteredExpenses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date Range</p>
                    <p className="text-sm font-medium">
                      {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters & Search</span>
              </span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <DateRangePicker className="w-full sm:w-auto" />
                <Button variant="outline" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                  Clear All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
              {/* Search */}
              <div className="relative lg:col-span-2 xl:col-span-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search description or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(categories as any[]).map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.emoji} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Partner Filter */}
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger data-testid="select-partner-filter">
                  <SelectValue placeholder="All Partners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  {(partners as any[]).map((partner: any) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Source Filter */}
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger data-testid="select-source-filter">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSources.map((source: string) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:col-span-2 xl:col-span-1">
                <Select value={sortBy} onValueChange={(value: "date" | "amount" | "category") => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:flex-1" data-testid="select-sort-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="amount">Sort by Amount</SelectItem>
                    <SelectItem value="category">Sort by Category</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="w-full sm:w-auto sm:px-3"
                  data-testid="button-sort-order"
                >
                  <ArrowUpDown className="h-4 w-4 sm:mr-0 mr-2" />
                  <span className="sm:hidden">{sortOrder === "asc" ? "Ascending" : "Descending"}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                {paginatedExpenses.length > 0 && (
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedExpenseIds.size === paginatedExpenses.length && paginatedExpenses.length > 0}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </div>
                )}
                <span>Transaction History</span>
              </div>
              <div className="flex items-center space-x-2">
                {selectedExpenseIds.size > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleBulkDeleteClick}
                    data-testid="button-bulk-delete"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {selectedExpenseIds.size} {selectedExpenseIds.size === 1 ? 'expense' : 'expenses'}
                  </Button>
                )}
                <Button variant="outline" size="sm" data-testid="button-export">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedExpenses.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions found for the selected criteria.</p>
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedExpenses.map((expense: any, index: number) => {
                  const category = getCategory(expense.categoryId);
                  const partner = getPartner(expense.partnerId);
                  const expenseDate = expense.date ? new Date(expense.date) : null;
                  const isSelected = selectedExpenseIds.has(expense.id);
                  
                  return (
                    <div key={expense.id || index} className="border border-border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleExpenseSelection(expense.id)}
                            data-testid={`checkbox-expense-${expense.id}`}
                          />
                        </div>
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {category && (
                            <div className="text-xl sm:text-2xl flex-shrink-0">{category.emoji}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {expense.description || "No description"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                              {expenseDate && isValid(expenseDate) && (
                                <span className="flex items-center space-x-1 flex-shrink-0">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>{format(expenseDate, 'MMM d, yyyy')}</span>
                                </span>
                              )}
                              {category && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                  {category.name}
                                </Badge>
                              )}
                              {partner && (
                                <span className="flex items-center space-x-1 flex-shrink-0">
                                  <User className="h-3 w-3" />
                                  <span>{partner.name}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right min-w-[80px]">
                          <p className="text-sm sm:text-lg font-semibold text-foreground">
                            €{parseFloat(expense.amount || "0").toFixed(2)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(expense.id)}
                            data-testid={`button-delete-${expense.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedExpenses.length)} of {sortedExpenses.length} transactions
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Navigation */}
      {isMobile && <BottomNavigation />}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Expenses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedExpenseIds.size} expense{selectedExpenseIds.size !== 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-bulk-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-bulk-delete"
            >
              Delete {selectedExpenseIds.size} expense{selectedExpenseIds.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function History() {
  return (
    <DateRangeProvider>
      <HistoryContent />
    </DateRangeProvider>
  );
}