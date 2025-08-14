import Layout from "@/components/layout";
import { StatementUploader } from "@/components/statement-uploader";
import { UploadHistory } from "@/components/upload-history";

export default function Upload() {
  return (
    <Layout 
      title="Upload Statements" 
      description="Upload financial statements and verify expenses"
    >
      <div className="space-y-6">
        <StatementUploader />
        <UploadHistory />
      </div>
    </Layout>
  );
}