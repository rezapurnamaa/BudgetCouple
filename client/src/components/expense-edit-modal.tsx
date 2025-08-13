import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Expense, Category, Partner } from '@shared/schema';

interface ExpenseEditModalProps {
  expense: Expense & { category: Category; partner: Partner };
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseEditModal({ expense, isOpen, onClose }: ExpenseEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    amount: expense.amount,
    description: expense.description,
    categoryId: expense.categoryId,
    partnerId: expense.partnerId,
    date: new Date(expense.date),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        body: {
          amount: data.amount,
          description: data.description,
          categoryId: data.categoryId,
          partnerId: data.partnerId,
          date: data.date.toISOString(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update expense",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount format
    const amount = formData.amount.replace(',', '.');
    const numericAmount = parseFloat(amount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      ...formData,
      amount: numericAmount.toString(),
    });
  };

  const formatAmount = (value: string) => {
    // Remove any non-numeric characters except comma and dot
    const cleaned = value.replace(/[^\d.,]/g, '');
    
    // Handle European format (comma as decimal separator)
    if (cleaned.includes(',') && !cleaned.includes('.')) {
      return cleaned;
    }
    
    // Handle mixed formats - prioritize dot as decimal
    if (cleaned.includes(',') && cleaned.includes('.')) {
      const parts = cleaned.split('.');
      if (parts.length === 2) {
        return `${parts[0].replace(/,/g, '')}.${parts[1]}`;
      }
    }
    
    return cleaned;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Make changes to this expense. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (€)</Label>
            <Input
              id="amount"
              value={formData.amount}
              onChange={(e) => {
                const formatted = formatAmount(e.target.value);
                setFormData(prev => ({ ...prev, amount: formatted }));
              }}
              placeholder="Enter amount (e.g., 25.50 or 25,50)"
              data-testid="input-edit-amount"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use comma (,) or dot (.) as decimal separator
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              data-testid="input-edit-description"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
            >
              <SelectTrigger data-testid="select-edit-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      <span>{category.emoji}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="partner">Partner</Label>
            <Select
              value={formData.partnerId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, partnerId: value }))}
            >
              <SelectTrigger data-testid="select-edit-partner">
                <SelectValue placeholder="Select partner" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: partner.color }}
                      />
                      <span>{partner.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                  data-testid="button-edit-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-edit-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-edit-save"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}