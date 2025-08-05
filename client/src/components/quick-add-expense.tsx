import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { insertExpenseSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = insertExpenseSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function QuickAddExpense() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPartner, setSelectedPartner] = useState<string>("");

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["/api/partners"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      description: "",
      categoryId: "",
      partnerId: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const expenseData = {
        ...data,
        amount: parseFloat(data.amount).toFixed(2),
      };
      return apiRequest("POST", "/api/expenses", expenseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      form.reset();
      setSelectedPartner("");
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createExpenseMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Add Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Who paid?</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      {partners.map((partner) => (
                        <Button
                          key={partner.id}
                          type="button"
                          variant={field.value === partner.id ? "default" : "outline"}
                          onClick={() => {
                            field.onChange(partner.id);
                            setSelectedPartner(partner.id);
                          }}
                          className="flex items-center justify-center space-x-2"
                          style={{
                            borderColor: field.value === partner.id ? partner.color : undefined,
                            backgroundColor: field.value === partner.id ? partner.color : undefined,
                          }}
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: field.value === partner.id ? 'white' : partner.color }}
                          />
                          <span>{partner.name}</span>
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={createExpenseMutation.isPending}
            >
              {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
