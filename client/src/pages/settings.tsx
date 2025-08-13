import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DesktopNavigation from "@/components/desktop-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  DollarSign,
  Calendar,
  User,
  Palette,
  Save,
  X
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";

interface BudgetPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

interface Partner {
  id: string;
  name: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  monthlyBudget: number;
}

function SettingsContent() {
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerColor, setNewPartnerColor] = useState("#3b82f6");
  const [newBudgetName, setNewBudgetName] = useState("");
  const [newBudgetStartDate, setNewBudgetStartDate] = useState("");
  const [newBudgetEndDate, setNewBudgetEndDate] = useState("");

  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["/api/partners"],
  });

  const { data: budgetPeriods = [] } = useQuery({
    queryKey: ["/api/budget-periods"],
  });

  // Partner mutations
  const addPartnerMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => 
      apiRequest("/api/partners", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setNewPartnerName("");
      setNewPartnerColor("#3b82f6");
      toast({ description: "Partner added successfully" });
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; color: string }) =>
      apiRequest(`/api/partners/${data.id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setEditingPartner(null);
      toast({ description: "Partner updated successfully" });
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/partners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ description: "Partner deleted successfully" });
    },
  });

  // Category budget mutations
  const updateCategoryBudgetMutation = useMutation({
    mutationFn: async (data: { id: string; monthlyBudget: number }) =>
      apiRequest(`/api/categories/${data.id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      toast({ description: "Budget updated successfully" });
    },
  });

  // Budget period mutations
  const addBudgetPeriodMutation = useMutation({
    mutationFn: async (data: { name: string; startDate: string; endDate: string }) =>
      apiRequest("/api/budget-periods", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-periods"] });
      setNewBudgetName("");
      setNewBudgetStartDate("");
      setNewBudgetEndDate("");
      toast({ description: "Budget period created successfully" });
    },
  });

  const toggleBudgetPeriodMutation = useMutation({
    mutationFn: async (data: { id: string; isActive: boolean }) =>
      apiRequest(`/api/budget-periods/${data.id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-periods"] });
      toast({ description: "Budget period updated successfully" });
    },
  });

  const deleteBudgetPeriodMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/budget-periods/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-periods"] });
      toast({ description: "Budget period deleted successfully" });
    },
  });

  const handleAddPartner = () => {
    if (!newPartnerName.trim()) return;
    addPartnerMutation.mutate({
      name: newPartnerName.trim(),
      color: newPartnerColor,
    });
  };

  const handleUpdatePartner = () => {
    if (!editingPartner) return;
    updatePartnerMutation.mutate(editingPartner);
  };

  const handleUpdateCategoryBudget = () => {
    if (!editingCategory) return;
    updateCategoryBudgetMutation.mutate({
      id: editingCategory.id,
      monthlyBudget: editingCategory.monthlyBudget,
    });
  };

  const handleAddBudgetPeriod = () => {
    if (!newBudgetName.trim() || !newBudgetStartDate || !newBudgetEndDate) return;
    addBudgetPeriodMutation.mutate({
      name: newBudgetName.trim(),
      startDate: newBudgetStartDate,
      endDate: newBudgetEndDate,
    });
  };

  const generateMonthlyBudget = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setNewBudgetName(format(startOfMonth, "MMMM yyyy"));
    setNewBudgetStartDate(format(startOfMonth, "yyyy-MM-dd"));
    setNewBudgetEndDate(format(endOfMonth, "yyyy-MM-dd"));
  };

  const colorOptions = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", 
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <SettingsIcon className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <DesktopNavigation />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="budgets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="budgets" data-testid="tab-budgets">Budget Management</TabsTrigger>
            <TabsTrigger value="partners" data-testid="tab-partners">Partners</TabsTrigger>
            <TabsTrigger value="periods" data-testid="tab-periods">Budget Periods</TabsTrigger>
          </TabsList>

          {/* Budget Management Tab */}
          <TabsContent value="budgets">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Category Budgets</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(categories as Category[]).map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{category.emoji}</span>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Monthly Budget: €{(category.monthlyBudget || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingCategory(category)}
                            data-testid={`button-edit-budget-${category.id}`}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Budget
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Budget for {category.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="budget-amount">Monthly Budget (€)</Label>
                              <Input
                                id="budget-amount"
                                type="number"
                                step="0.01"
                                value={editingCategory?.monthlyBudget || 0}
                                onChange={(e) =>
                                  setEditingCategory(prev =>
                                    prev ? { ...prev, monthlyBudget: parseFloat(e.target.value) || 0 } : null
                                  )
                                }
                                data-testid="input-budget-amount"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button
                                onClick={handleUpdateCategoryBudget}
                                disabled={updateCategoryBudgetMutation.isPending}
                                data-testid="button-save-budget"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save Budget
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Partners Tab */}
          <TabsContent value="partners">
            <div className="space-y-6">
              {/* Add New Partner */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Add New Partner</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="partner-name">Partner Name</Label>
                      <Input
                        id="partner-name"
                        value={newPartnerName}
                        onChange={(e) => setNewPartnerName(e.target.value)}
                        placeholder="Enter partner name..."
                        data-testid="input-partner-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="partner-color">Color</Label>
                      <div className="flex space-x-2 mt-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewPartnerColor(color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              newPartnerColor === color ? "border-primary" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                            data-testid={`color-option-${color}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleAddPartner}
                        disabled={!newPartnerName.trim() || addPartnerMutation.isPending}
                        data-testid="button-add-partner"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Partner
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Partners */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Existing Partners</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(partners as Partner[]).map((partner) => (
                      <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: partner.color }}
                          />
                          <span className="font-medium">{partner.name}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingPartner(partner)}
                                data-testid={`button-edit-partner-${partner.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Partner</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-partner-name">Name</Label>
                                  <Input
                                    id="edit-partner-name"
                                    value={editingPartner?.name || ""}
                                    onChange={(e) =>
                                      setEditingPartner(prev =>
                                        prev ? { ...prev, name: e.target.value } : null
                                      )
                                    }
                                    data-testid="input-edit-partner-name"
                                  />
                                </div>
                                <div>
                                  <Label>Color</Label>
                                  <div className="flex space-x-2 mt-2">
                                    {colorOptions.map((color) => (
                                      <button
                                        key={color}
                                        onClick={() =>
                                          setEditingPartner(prev =>
                                            prev ? { ...prev, color } : null
                                          )
                                        }
                                        className={`w-8 h-8 rounded-full border-2 ${
                                          editingPartner?.color === color ? "border-primary" : "border-gray-300"
                                        }`}
                                        style={{ backgroundColor: color }}
                                        data-testid={`edit-color-option-${color}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <DialogTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogTrigger>
                                  <Button
                                    onClick={handleUpdatePartner}
                                    disabled={updatePartnerMutation.isPending}
                                    data-testid="button-save-partner"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePartnerMutation.mutate(partner.id)}
                            disabled={deletePartnerMutation.isPending}
                            data-testid={`button-delete-partner-${partner.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Budget Periods Tab */}
          <TabsContent value="periods">
            <div className="space-y-6">
              {/* Create New Budget Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Create Budget Period</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="budget-period-name">Period Name</Label>
                      <Input
                        id="budget-period-name"
                        value={newBudgetName}
                        onChange={(e) => setNewBudgetName(e.target.value)}
                        placeholder="e.g., January 2025"
                        data-testid="input-budget-period-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget-start-date">Start Date</Label>
                      <Input
                        id="budget-start-date"
                        type="date"
                        value={newBudgetStartDate}
                        onChange={(e) => setNewBudgetStartDate(e.target.value)}
                        data-testid="input-budget-start-date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget-end-date">End Date</Label>
                      <Input
                        id="budget-end-date"
                        type="date"
                        value={newBudgetEndDate}
                        onChange={(e) => setNewBudgetEndDate(e.target.value)}
                        data-testid="input-budget-end-date"
                      />
                    </div>
                    <div className="flex items-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={generateMonthlyBudget}
                        data-testid="button-generate-monthly"
                      >
                        This Month
                      </Button>
                      <Button
                        onClick={handleAddBudgetPeriod}
                        disabled={!newBudgetName.trim() || !newBudgetStartDate || !newBudgetEndDate || addBudgetPeriodMutation.isPending}
                        data-testid="button-create-budget-period"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Budget Periods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Budget Periods</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(budgetPeriods as BudgetPeriod[]).map((period) => (
                      <div key={period.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium flex items-center space-x-2">
                              <span>{period.name}</span>
                              {period.isActive && <Badge variant="default">Active</Badge>}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(period.startDate), "MMM d, yyyy")} - {format(new Date(period.endDate), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant={period.isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              toggleBudgetPeriodMutation.mutate({
                                id: period.id,
                                isActive: !period.isActive,
                              })
                            }
                            disabled={toggleBudgetPeriodMutation.isPending}
                            data-testid={`button-toggle-period-${period.id}`}
                          >
                            {period.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBudgetPeriodMutation.mutate(period.id)}
                            disabled={deleteBudgetPeriodMutation.isPending}
                            data-testid={`button-delete-period-${period.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Navigation */}
      {isMobile && <BottomNavigation />}
    </div>
  );
}

export default function Settings() {
  return <SettingsContent />;
}