import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ExpenseVerification } from './expense-verification';
import { BudgetPeriodManager } from './budget-period-manager';
import type { Partner, Statement } from '@shared/schema';

interface UploadFormData {
  file: File | null;
  source: string;
  defaultPartnerId: string;
}

export function StatementUploader() {
  const [formData, setFormData] = useState<UploadFormData>({
    file: null,
    source: '',
    defaultPartnerId: '',
  });
  const [uploadedStatementId, setUploadedStatementId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch partners for selection
  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
  });

  // Fetch uploaded statement status
  const { data: uploadedStatement } = useQuery<Statement>({
    queryKey: ['/api/statements', uploadedStatementId],
    enabled: !!uploadedStatementId,
    refetchInterval: (data) => {
      if (!uploadedStatementId) return false;
      const status = data?.status || '';
      return ['pending', 'processing'].includes(status) ? 2000 : false;
    }, // Refetch every 2 seconds while processing
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest('/api/statements/upload', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: (response) => {
      toast({
        title: 'Upload Successful',
        description: 'Your statement is being processed. This may take a few minutes.',
      });
      setUploadedStatementId(response.statementId);
      queryClient.invalidateQueries({ queryKey: ['/api/statements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      // Reset form
      setFormData({ file: null, source: '', defaultPartnerId: '' });
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload statement',
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.source || !formData.defaultPartnerId) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Duplicate checking will be implemented later when we have proper statements data

    // Duplicate check removed for now
    // if (isDuplicate) {
    //   toast({
    //     title: "Duplicate File", 
    //     description: "This file appears to have been uploaded already. Please check your upload history below.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    const uploadFormData = new FormData();
    uploadFormData.append('file', formData.file);
    uploadFormData.append('source', formData.source);
    uploadFormData.append('defaultPartnerId', formData.defaultPartnerId);

    uploadMutation.mutate(uploadFormData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getProgressPercentage = () => {
    if (!uploadedStatement || !uploadedStatement.totalTransactions) return 0;
    return Math.round(
      (uploadedStatement.processedTransactions || 0) / uploadedStatement.totalTransactions * 100
    );
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-statement-uploader">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Financial Statement
          </CardTitle>
          <CardDescription>
            Upload your AMEX or bank statement (CSV format) to automatically categorize and add transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Statement File (CSV)</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,text/csv,application/csv"
                onChange={handleFileChange}
                data-testid="input-file-upload"
              />
              {formData.file && (
                <p className="text-sm text-gray-600" data-testid="text-selected-file">
                  Selected: {formData.file.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-select">Statement Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
                data-testid="select-statement-source"
              >
                <SelectTrigger id="source-select">
                  <SelectValue placeholder="Select statement source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amex">American Express</SelectItem>
                  <SelectItem value="chase">Chase Bank</SelectItem>
                  <SelectItem value="bank">Other Bank</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-select">Default Partner</Label>
              <Select
                value={formData.defaultPartnerId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, defaultPartnerId: value }))}
                data-testid="select-default-partner"
              >
                <SelectTrigger id="partner-select">
                  <SelectValue placeholder="Select who made these purchases" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={!formData.file || !formData.source || !formData.defaultPartnerId || uploadMutation.isPending}
              className="w-full"
              data-testid="button-upload-statement"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Process Statement
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {uploadedStatement && (
        <Card data-testid="card-processing-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(uploadedStatement.status)}
              Processing Status: {uploadedStatement.fileName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span data-testid="text-processing-progress">
                  {uploadedStatement.processedTransactions || 0} / {uploadedStatement.totalTransactions || 0} transactions
                </span>
              </div>
              <Progress
                value={getProgressPercentage()}
                className="h-2"
                data-testid="progress-processing"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Status:</strong> {uploadedStatement.status}
              </div>
              <div>
                <strong>Source:</strong> {uploadedStatement.source.toUpperCase()}
              </div>
              <div>
                <strong>Uploaded:</strong> {new Date(uploadedStatement.uploadedAt).toLocaleString()}
              </div>
              {uploadedStatement.processedAt && (
                <div>
                  <strong>Completed:</strong> {new Date(uploadedStatement.processedAt).toLocaleString()}
                </div>
              )}
            </div>

            {uploadedStatement.errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm" data-testid="text-error-message">
                  <strong>Error:</strong> {uploadedStatement.errorMessage}
                </p>
              </div>
            )}

            {uploadedStatement.status === 'completed' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm" data-testid="text-success-message">
                  <strong>Success!</strong> {uploadedStatement.processedTransactions} transactions have been added to your expenses. 
                  Please verify and edit the expenses below.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expense Verification for completed uploads */}
      {uploadedStatement && uploadedStatement.status === 'completed' && (
        <ExpenseVerification statementId={uploadedStatement.id} />
      )}


    </div>
  );
}