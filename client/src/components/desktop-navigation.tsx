import { Home, BarChart3, Plus, List, Upload, Settings, FileText, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function DesktopNavigation() {
  const [location, setLocation] = useLocation();

  const navigationItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/history", icon: List, label: "History" },
    { path: "/upload", icon: Upload, label: "Upload" },
    { path: "/statements", icon: FileText, label: "Statements" },
    { path: "/bulk-add", icon: PlusSquare, label: "Bulk Add" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const scrollToQuickAdd = () => {
    const quickAddElement = document.querySelector('[data-testid="quick-add-expense"]');
    if (quickAddElement) {
      quickAddElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus the amount input
      const amountInput = quickAddElement.querySelector('input[type="text"]') as HTMLInputElement;
      if (amountInput) {
        setTimeout(() => amountInput.focus(), 100);
      }
    }
  };

  return (
    <nav className="hidden lg:flex items-center space-x-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.path;
        
        return (
          <Button
            key={item.path}
            variant={isActive ? "default" : "ghost"}
            className="flex items-center space-x-2"
            onClick={() => setLocation(item.path)}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Button>
        );
      })}
      
      {/* Quick Add Button for Dashboard */}
      {location === "/" && (
        <Button
          variant="outline"
          className="flex items-center space-x-2 ml-4"
          onClick={scrollToQuickAdd}
        >
          <Plus className="h-4 w-4" />
          <span>Quick Add</span>
        </Button>
      )}
    </nav>
  );
}