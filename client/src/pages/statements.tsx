import { StatementUploader } from "@/components/StatementUploader";
import { StatementsList } from "@/components/StatementsList";
import Layout from "@/components/layout";

export default function StatementsPage() {
  return (
    <Layout 
      title="Bank Statements" 
      description="Upload your DKB or other bank statements for automatic expense categorization using AI."
    >
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <StatementUploader />
        </div>
        <div>
          <StatementsList />
        </div>
      </div>
    </Layout>
  );
}
