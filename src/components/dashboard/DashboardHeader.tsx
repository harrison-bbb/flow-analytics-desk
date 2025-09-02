import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const DashboardHeader = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <img 
            src="/lovable-uploads/1c3eaeb6-791e-4b7a-8d00-aeec1efccd4d.png" 
            alt="Company Logo" 
            className="h-12 w-12 object-contain"
          />
          <h1 className="text-4xl font-bold tracking-tight gradient-text">
            Dashboard
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Welcome back, <span className="text-primary font-medium">{user?.email}</span>
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        <Button 
          variant="outline" 
          onClick={signOut}
          className="flex items-center gap-2 border-border/50 hover:border-border bg-card text-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};