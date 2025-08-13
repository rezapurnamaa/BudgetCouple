import { StatementUploader } from "@/components/statement-uploader";
import { BudgetPeriodManager } from "@/components/budget-period-manager";

export default function Upload() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="text-page-title">
          Upload & Budget Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400" data-testid="text-page-description">
          Upload financial statements, verify expenses, and manage budgets within specific time ranges
        </p>
      </div>
      
      <StatementUploader />
    </div>
  );
}