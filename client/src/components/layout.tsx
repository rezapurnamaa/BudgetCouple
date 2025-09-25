import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import DesktopNavigation from "@/components/desktop-navigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function Layout({ children, title, description }: LayoutProps) {
  const isMobile = useIsMobile();

  const { data: partners = [] } = useQuery<any[]>({
    queryKey: ["/api/partners"],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="nav-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                CoupleFinance
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <DesktopNavigation />

              {/* Partner indicators */}
              <div className="partner-indicator-container">
                {partners.map((partner: any) => (
                  <div key={partner.id} className="partner-indicator-item">
                    <div
                      className="partner-indicator-dot"
                      style={{ backgroundColor: partner.color }}
                    />
                    <span className="partner-indicator-name">
                      {partner.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title Section */}
      <div className="page-title-section">
        <div className="page-title-container">
          <h1 className="page-title" data-testid="text-page-title">
            {title}
          </h1>
          {description && (
            <p className="page-description" data-testid="text-page-description">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile Bottom Navigation with extra padding for iOS */}
      {isMobile && (
        <>
          <div className="h-20"></div>
          <BottomNavigation />
        </>
      )}
    </div>
  );
}