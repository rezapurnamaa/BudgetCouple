import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Statement } from '@shared/schema';

export function UploadHistory() {
  const { data: statements = [] } = useQuery<Statement[]>({
    queryKey: ["/api/statements"],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (statements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
          <CardDescription>
            No statements have been uploaded yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Sort by upload date, most recent first
  const sortedStatements = [...statements].sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload History</CardTitle>
        <CardDescription>
          Track your uploaded statements and their processing status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedStatements.map((statement) => (
            <div 
              key={statement.id} 
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              data-testid={`statement-${statement.id}`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(statement.status)}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-gray-900 truncate" data-testid="statement-filename">
                      {statement.fileName}
                    </p>
                    <Badge 
                      className={getStatusColor(statement.status)}
                      data-testid="statement-status"
                    >
                      {statement.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {statement.source.toUpperCase()}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(statement.uploadedAt), { addSuffix: true })}
                    </span>
                    {statement.totalTransactions && (
                      <span>
                        {statement.processedTransactions || 0}/{statement.totalTransactions} transactions
                      </span>
                    )}
                  </div>
                  
                  {statement.errorMessage && (
                    <p className="text-sm text-red-600 mt-1" data-testid="statement-error">
                      Error: {statement.errorMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {statement.status === 'completed' && statement.processedTransactions && (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ {statement.processedTransactions} added
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}