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

  const { data: partners = [] } = useQuery({
    queryKey: ["/api/partners"],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
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
              <div className="flex items-center space-x-2">
                {partners.map((partner: any) => (
                  <div key={partner.id} className="flex items-center space-x-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: partner.color }}
                    />
                    <span className="text-sm text-muted-foreground">
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
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-page-title">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2" data-testid="text-page-description">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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