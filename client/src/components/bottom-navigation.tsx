import { useState } from "react";
import {
  Home,
  BarChart3,
  Plus,
  List,
  Upload,
  Settings,
  FileText,
  Menu,
  X,
  PlusSquare,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/theme-context";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Primary navigation items (visible in bottom nav)
  const primaryItems = [
    { path: "/", icon: Home, label: "Home", id: "home" },
    {
      path: "/analytics",
      icon: BarChart3,
      label: "Analytics",
      id: "analytics",
    },
    { path: "#add", icon: Plus, label: "Add", isAction: true, id: "add" },
    {
      path: "/statements",
      icon: FileText,
      label: "Statements",
      id: "statements",
    },
  ];

  // Secondary navigation items (in hamburger menu)
  const secondaryItems = [
    { path: "/history", icon: List, label: "History", id: "history" },
    { path: "/upload", icon: Upload, label: "Upload", id: "upload" },
    { path: "/bulk-add", icon: PlusSquare, label: "Bulk Add", id: "bulk-add" },
    { path: "/settings", icon: Settings, label: "Settings", id: "settings" },
  ];

  const scrollToQuickAdd = () => {
    const quickAddElement = document.querySelector(
      '[data-testid="quick-add-expense"]',
    );
    if (quickAddElement) {
      quickAddElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Focus the amount input
      const amountInput = quickAddElement.querySelector(
        'input[type="text"]',
      ) as HTMLInputElement;
      if (amountInput) {
        setTimeout(() => amountInput.focus(), 100);
      }
    }
  };

  return (
    <nav className="nav-container-mobile">
      <div className="flex justify-between">
        {/* Primary Navigation Items */}
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          const isAddButton = item.isAction;

          return (
            <Button
              key={item.id}
              variant={isAddButton ? "default" : "ghost"}
              className={`nav-button-mobile ${
                isAddButton ? "rounded-lg" : ""
              } ${
                isActive && !isAddButton
                  ? "nav-button-active-mobile"
                  : !isActive && !isAddButton
                    ? "nav-button-inactive-mobile"
                    : ""
              }`}
              onClick={() => {
                if (isAddButton) {
                  scrollToQuickAdd();
                } else if (!item.path.startsWith("#")) {
                  setLocation(item.path);
                }
              }}
              data-testid={`nav-${item.id}`}
            >
              <Icon className="nav-icon-mobile" />
              <span className="nav-label-mobile">{item.label}</span>
            </Button>
          );
        })}

        {/* Hamburger Menu */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex flex-col items-center py-2 px-2 text-muted-foreground hover:text-foreground"
              data-testid="nav-menu"
            >
              <Menu className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4 mt-6 mb-4">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "outline"}
                    className="flex items-center gap-3 h-12"
                    onClick={() => {
                      setLocation(item.path);
                      setIsMenuOpen(false);
                    }}
                    data-testid={`menu-${item.id}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
              
              {/* Theme Toggle */}
              <Button
                variant="outline"
                className="flex items-center gap-3 h-12"
                onClick={toggleTheme}
                data-testid="menu-theme-toggle"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <span>{theme === "light" ? "Dark" : "Light"}</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
