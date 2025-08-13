import { StatementUploader } from "@/components/statement-uploader";

export default function Upload() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="text-page-title">
          Upload Statements
        </h1>
        <p className="text-gray-600 dark:text-gray-400" data-testid="text-page-description">
          Upload your financial statements to automatically add and categorize transactions
        </p>
      </div>
      
      <StatementUploader />
    </div>
  );
}