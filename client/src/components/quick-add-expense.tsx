import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { insertExpenseSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = insertExpenseSchema.extend({
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(
      /^-?[0-9]+([.,][0-9]{1,2})?$/,
      "Please enter a valid amount (e.g., 10.50, -5.00 for refunds)",
    ),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Please select a category"),
  partnerId: z.string().min(1, "Please select who paid"),
});

type FormData = z.infer<typeof formSchema>;

export default function QuickAddExpense() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPartner, setSelectedPartner] = useState<string>("");

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: partners = [] } = useQuery<any[]>({
    queryKey: ["/api/partners"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      description: "",
      categoryId: "",
      partnerId: "",
      date: new Date().toISOString().split("T")[0],
      sourceLabel: "",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Handle comma as decimal separator and preserve sign for refunds
      const normalizedAmount = data.amount.replace(",", ".");
      const parsedAmount = parseFloat(normalizedAmount);
      const expenseData = {
        ...data,
        amount: parsedAmount.toFixed(2), // Keep the sign for negative amounts (refunds)
      };
      return apiRequest("/api/expenses", {
        method: "POST",
        body: expenseData,
      });
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
    // Additional validation to ensure all required fields are present
    if (!data.categoryId) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    if (!data.partnerId) {
      toast({
        title: "Error",
        description: "Please select who paid",
        variant: "destructive",
      });
      return;
    }

    createExpenseMutation.mutate(data);
  };

  return (
    <Card data-testid="quick-add-expense">
      <CardHeader>
        <CardTitle>Quick Add Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (use minus sign for refunds)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        €
                      </span>
                      <Input
                        {...field}
                        type="text"
                        placeholder="10.50 or -5.00 for refund"
                        className="pl-8"
                        onChange={(e) => {
                          // Allow numbers, dots, commas, and minus sign
                          const value = e.target.value.replace(/[^0-9.,-]/g, "");
                          field.onChange(value);
                        }}
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
              name="sourceLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AMEX">AMEX</SelectItem>
                      <SelectItem value="DKB">DKB Bank</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Other Card">Other Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
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
                          variant={
                            field.value === partner.id ? "default" : "outline"
                          }
                          onClick={() => {
                            field.onChange(partner.id);
                            setSelectedPartner(partner.id);
                          }}
                          className="flex items-center justify-center space-x-2"
                          style={{
                            borderColor:
                              field.value === partner.id
                                ? partner.color
                                : undefined,
                            backgroundColor:
                              field.value === partner.id
                                ? partner.color
                                : undefined,
                          }}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                field.value === partner.id
                                  ? "white"
                                  : partner.color,
                            }}
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
