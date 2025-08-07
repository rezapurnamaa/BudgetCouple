import { Home, BarChart3, Plus, List, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navigationItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "#", icon: Plus, label: "Add", isAction: true },
    { path: "#", icon: List, label: "History" },
    { path: "#", icon: User, label: "Profile" },
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 pb-safe z-50">
      <div className="flex justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          const isAddButton = item.isAction;
          
          return (
            <Button
              key={item.path}
              variant={isAddButton ? "default" : "ghost"}
              className={`flex flex-col items-center py-2 px-3 ${
                isAddButton ? "rounded-lg" : ""
              } ${
                isActive && !isAddButton ? "text-primary" : 
                !isActive && !isAddButton ? "text-muted-foreground hover:text-foreground" : ""
              }`}
              onClick={() => {
                if (isAddButton) {
                  scrollToQuickAdd();
                } else if (!item.path.startsWith("#")) {
                  setLocation(item.path);
                }
              }}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
