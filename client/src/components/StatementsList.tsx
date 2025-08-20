import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatementExpensesView } from "@/components/StatementExpensesView";
import { cn } from "@/lib/utils";

interface Statement {
  id: string;
  fileName: string;
  fileType: string;
  source: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalTransactions?: number | null;
  processedTransactions?: number | null;
  errorMessage?: string | null;
  uploadedAt: string;
  processedAt?: string | null;
}

export function StatementsList() {
  const [selectedStatement, setSelectedStatement] = useState<string | null>(
    null,
  );
  const [expandedStatements, setExpandedStatements] = useState<Set<string>>(
    new Set(),
  );

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedStatements);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedStatements(newExpanded);
  };

  const truncateFileName = (fileName: string, maxLength: number = 35) => {
    if (fileName.length <= maxLength) return fileName;
    
    // Handle files with extensions
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex > 0 && lastDotIndex < fileName.length - 1) {
      const extension = fileName.slice(lastDotIndex);
      const nameWithoutExt = fileName.slice(0, lastDotIndex);
      const availableLength = maxLength - extension.length - 3; // 3 for "..."
      
      if (availableLength > 5) { // Minimum reasonable truncation
        return nameWithoutExt.slice(0, availableLength) + "..." + extension;
      }
    }
    
    // Handle files without extensions or when extension handling fails
    return fileName.slice(0, maxLength - 3) + "...";
  };

  const { data: statements = [], isLoading } = useQuery<Statement[]>({
    queryKey: ["/api/statements"],
    refetchInterval: (query) => {
      // Auto-refresh every 3 seconds if there are pending/processing statements
      const hasActiveStatement = query.state.data?.some(
        (s) => s.status === "pending" || s.status === "processing",
      );
      return hasActiveStatement ? 3000 : false;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "processing":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4 animate-spin" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getProgressText = (statement: Statement) => {
    if (statement.status === "completed" && statement.totalTransactions) {
      return `${statement.processedTransactions || 0}/${statement.totalTransactions} transactions processed`;
    }
    if (statement.status === "processing" && statement.totalTransactions) {
      return `Processing ${statement.processedTransactions || 0}/${statement.totalTransactions}...`;
    }
    if (statement.status === "failed") {
      return statement.errorMessage || "Processing failed";
    }
    return "Waiting to process...";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading statements...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (statements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No statements uploaded yet.</p>
            <p className="text-sm">
              Upload your first statement to get started!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statements.map((statement, index) => {
            const isExpanded = expandedStatements.has(statement.id);
            const shouldTruncate = statement.fileName.length > 35;

            return (
              <div key={statement.id}>
                <div className="flex items-start justify-between p-4 rounded-lg border">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className="font-medium"
                            title={statement.fileName}
                          >
                            {isExpanded || !shouldTruncate
                              ? statement.fileName
                              : truncateFileName(statement.fileName)}
                          </h4>
                          {shouldTruncate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleExpanded(statement.id)}
                              data-testid={`expand-${statement.id}`}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{statement.source}</span>
                          <span>•</span>
                          <span>
                            {format(
                              new Date(statement.uploadedAt),
                              "MMM dd, yyyy HH:mm",
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        className={`${getStatusColor(statement.status)} text-white`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(statement.status)}
                          <span className="capitalize">{statement.status}</span>
                        </div>
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="text-sm text-muted-foreground">
                      {getProgressText(statement)}
                    </div>

                    {/* Progress Bar */}
                    {statement.status === "processing" &&
                      statement.totalTransactions && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                ((statement.processedTransactions || 0) /
                                  statement.totalTransactions) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      )}

                    {/* Actions */}
                    {statement.status === "completed" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-view-expenses-${statement.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Expenses (
                            {statement.processedTransactions || 0})
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Statement Expenses</DialogTitle>
                          </DialogHeader>
                          <StatementExpensesView statementId={statement.id} />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                {index < statements.length - 1 && <Separator />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
