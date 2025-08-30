import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ExecutionsChart } from "@/components/dashboard/ExecutionsChart";
import { LoginForm } from "@/components/auth/LoginForm";
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Zap, 
  GitBranch, 
  Activity,
  Database
} from "lucide-react";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (email: string, password: string) => {
    // This is a demo login - in production, use Supabase authentication
    if (email && password) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader />
        
        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="ROI"
            value="284%"
            icon={TrendingUp}
            trend={{ value: 12.5, label: "from last month" }}
            variant="success"
          />
          <MetricCard
            title="Time Saved This Month"
            value="156h"
            icon={Clock}
            trend={{ value: 8.2, label: "from last month" }}
            variant="success"
          />
          <MetricCard
            title="Money Saved This Month"
            value="$18,000"
            icon={DollarSign}
            trend={{ value: 15.3, label: "from last month" }}
            variant="success"
          />
          <MetricCard
            title="Money Saved All Time"
            value="$127,400"
            icon={DollarSign}
            variant="success"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Total Executions This Month"
            value="1,847"
            icon={Zap}
            trend={{ value: 22.1, label: "from last month" }}
          />
          <MetricCard
            title="Current Managed Workflows"
            value="23"
            icon={GitBranch}
            trend={{ value: 4.3, label: "new this month" }}
          />
          <MetricCard
            title="API Usage"
            value="89%"
            icon={Database}
            trend={{ value: -2.1, label: "from last month" }}
            variant="warning"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <RevenueChart />
          <ExecutionsChart />
        </div>
      </div>
    </div>
  );
};

export default Index;
