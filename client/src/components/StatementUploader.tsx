import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadResponse {
  statementId: string;
  message: string;
}

export function StatementUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [source, setSource] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: partners = [] } = useQuery<any[]>({
    queryKey: ["/api/partners"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<UploadResponse> => {
      const response = await fetch("/api/statements/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      
      setSelectedFile(null);
      setSource("");
      setPartnerId("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/statements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !source) {
      toast({
        title: "Missing Information",
        description: "Please select a file and specify the source.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("source", source);
    if (partnerId) {
      formData.append("partnerId", partnerId);
    }

    uploadMutation.mutate(formData);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Statement
        </CardTitle>
        <CardDescription>
          Upload your DKB or other bank statements for automatic expense categorization using AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="file">CSV File</Label>
          <Input
            id="file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            data-testid="input-statement-file"
            disabled={uploadMutation.isPending}
          />
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {selectedFile.name}
            </div>
          )}
        </div>

        {/* Source Selection */}
        <div className="space-y-2">
          <Label htmlFor="source">Bank/Source</Label>
          <Select
            value={source}
            onValueChange={setSource}
            disabled={uploadMutation.isPending}
          >
            <SelectTrigger data-testid="select-statement-source">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dkb">DKB Bank</SelectItem>
              <SelectItem value="amex">American Express</SelectItem>
              <SelectItem value="chase">Chase Bank</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="bank">Generic Bank</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Partner Selection */}
        <div className="space-y-2">
          <Label htmlFor="partner">Default Partner (Optional)</Label>
          <Select
            value={partnerId}
            onValueChange={setPartnerId}
            disabled={uploadMutation.isPending}
          >
            <SelectTrigger data-testid="select-default-partner">
              <SelectValue placeholder="Select partner" />
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

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !source || uploadMutation.isPending}
          className="w-full"
          data-testid="button-upload-statement"
        >
          {uploadMutation.isPending ? (
            "Processing..."
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload & Process
            </>
          )}
        </Button>

        {/* Status Display */}
        {uploadMutation.isError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            Upload failed. Please try again.
          </div>
        )}

        {uploadMutation.isSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Statement uploaded successfully!
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Supported formats: CSV files</p>
          <p>• Automatic AI categorization</p>
          <p>• European date format support (DD-MM-YYYY)</p>
          <p>• European decimal format (comma separator)</p>
        </div>
      </CardContent>
    </Card>
  );
}