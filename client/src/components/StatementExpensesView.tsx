import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Clock, Euro } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface StatementExpense {
  id: string;
  amount: string;
  description: string;
  categoryId: string;
  partnerId: string;
  date: string;
  isVerified: "pending" | "verified" | "rejected";
  originalAmount?: string;
  sourceLabel?: string;
  category?: {
    id: string;
    name: string;
    emoji: string;
    color: string;
  };
  partner?: {
    id: string;
    name: string;
    color: string;
  };
}

interface StatementExpensesViewProps {
  statementId: string;
}

export function StatementExpensesView({ statementId }: StatementExpensesViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery<StatementExpense[]>({
    queryKey: ["/api/statements", statementId, "expenses"],
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ expenseId, isVerified }: { expenseId: string; isVerified: string }) => {
      return apiRequest(`/api/expenses/${expenseId}/verify`, {
        method: "PATCH",
        body: { isVerified },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/statements", statementId, "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    },
    onError: () => {
      toast({
        title: "Verification Failed",
        description: "Failed to update expense verification.",
        variant: "destructive",
      });
    },
  });

  const handleVerify = (expenseId: string, status: "verified" | "rejected") => {
    verifyMutation.mutate({ expenseId, isVerified: status });
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const groupedExpenses = expenses.reduce((acc, expense) => {
    const status = expense.isVerified;
    if (!acc[status]) acc[status] = [];
    acc[status].push(expense);
    return acc;
  }, {} as Record<string, StatementExpense[]>);

  const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const verifiedCount = expenses.filter(e => e.isVerified === "verified").length;
  const pendingCount = expenses.filter(e => e.isVerified === "pending").length;
  const rejectedCount = expenses.filter(e => e.isVerified === "rejected").length;

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading expenses...
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No expenses found for this statement.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center">
                <Euro className="h-5 w-5 mr-1" />
                {totalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <div className="space-y-4">
        {["pending", "verified", "rejected"].map((status) => {
          const statusExpenses = groupedExpenses[status] || [];
          if (statusExpenses.length === 0) return null;

          return (
            <div key={status}>
              <h3 className="font-semibold mb-3 capitalize">{status} Expenses ({statusExpenses.length})</h3>
              <div className="space-y-2">
                {statusExpenses.map((expense, index) => (
                  <Card key={expense.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">€{parseFloat(expense.amount).toFixed(2)}</span>
                              {expense.sourceLabel && (
                                <Badge variant="outline" className="text-xs">
                                  {expense.sourceLabel}
                                </Badge>
                              )}
                            </div>
                            {getVerificationBadge(expense.isVerified)}
                          </div>

                          {/* Description */}
                          <div className="text-sm">{expense.description}</div>

                          {/* Category and Date */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {expense.category && (
                              <div className="flex items-center gap-1">
                                <span>{expense.category.emoji}</span>
                                <span>{expense.category.name}</span>
                              </div>
                            )}
                            <span>{format(new Date(expense.date), "MMM dd, yyyy")}</span>
                            {expense.partner && (
                              <span>{expense.partner.name}</span>
                            )}
                          </div>

                          {/* Verification Actions */}
                          {expense.isVerified === "pending" && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerify(expense.id, "verified")}
                                disabled={verifyMutation.isPending}
                                data-testid={`button-verify-${expense.id}`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerify(expense.id, "rejected")}
                                disabled={verifyMutation.isPending}
                                data-testid={`button-reject-${expense.id}`}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {status !== "rejected" && <Separator className="my-6" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}