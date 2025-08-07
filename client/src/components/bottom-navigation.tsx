import { Home, BarChart3, Plus, List, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BottomNavigation() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 pb-safe z-50">
      <div className="flex justify-around">
        <Button variant="ghost" className="flex flex-col items-center py-2 px-3 text-primary">
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Home</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center py-2 px-3 text-muted-foreground hover:text-foreground">
          <BarChart3 className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Reports</span>
        </Button>
        <Button className="flex flex-col items-center py-2 px-3 rounded-lg">
          <Plus className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Add</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center py-2 px-3 text-muted-foreground hover:text-foreground">
          <List className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">History</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center py-2 px-3 text-muted-foreground hover:text-foreground">
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Profile</span>
        </Button>
      </div>
    </nav>
  );
}
