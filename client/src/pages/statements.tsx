import { StatementUploader } from "@/components/StatementUploader";
import { StatementsList } from "@/components/StatementsList";
import DesktopNavigation from "@/components/desktop-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useIsMobile } from "@/hooks/use-mobile";

export default function StatementsPage() {
  const isMobile = useIsMobile();

  return (
    <>
      {!isMobile && <DesktopNavigation />}
      <div className="container mx-auto p-4 space-y-8 pb-20 lg:pb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bank Statements</h1>
          <p className="text-muted-foreground">
            Upload your DKB or other bank statements for automatic expense
            categorization using AI.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <StatementUploader />
          </div>
          <div>
            <StatementsList />
          </div>
        </div>
      </div>
      {isMobile && <BottomNavigation />}
    </>
  );
}
