import Layout from "@/components/layout";
import { StatementUploader } from "@/components/statement-uploader";
import { BudgetPeriodManager } from "@/components/budget-period-manager";
import { UploadHistory } from "@/components/upload-history";

export default function Upload() {
  return (
    <Layout 
      title="Upload & Budget Management" 
      description="Upload financial statements, verify expenses, and manage budgets within specific time ranges"
    >
      <div className="space-y-6">
        <StatementUploader />
        <BudgetPeriodManager />
        <UploadHistory />
      </div>
    </Layout>
  );
}