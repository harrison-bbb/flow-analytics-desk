import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ExecutionsChart } from "@/components/dashboard/ExecutionsChart";
import { WorkflowPerformanceTable } from "@/components/dashboard/WorkflowPerformanceTable";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ExecutionStatusChart } from "@/components/dashboard/ExecutionStatusChart";
import { ClientContactCard } from "@/components/dashboard/ClientContactCard";
import { useAuth } from "@/hooks/useAuth";
import { useUserMetrics } from "@/hooks/useUserMetrics";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Zap, 
  GitBranch, 
  Activity
} from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const { metrics, trends, loading: metricsLoading } = useUserMetrics();
  const { userSubscription } = useSubscriptionPlans();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || metricsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
  }

  // Calculate monthly ROI dynamically
  const calculateMonthlyROI = () => {
    if (!metrics || !userSubscription?.plan) return 0;
    
    const monthlySavings = metrics.money_saved_month;
    const planCost = userSubscription.plan.monthly_cost_aud;
    
    if (planCost <= 0) return 0;
    
    const roi = ((monthlySavings - planCost) / planCost) * 100;
    return roi;
  };

  const monthlyROI = calculateMonthlyROI();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-black"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/2 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/2 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader />
        
        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="ROI This Month"
            value={`${Math.round(monthlyROI)}%`}
            icon={TrendingUp}
            variant={monthlyROI > 0 ? "success" : "default"}
            trend={trends?.roi_change !== undefined ? {
              value: Math.round(trends.roi_change * 100) / 100,
              label: "since last month"
            } : undefined}
          />
          <MetricCard
            title="Time Saved This Month"
            value={`${metrics?.time_saved_month || 0}h`}
            icon={Clock}
            variant="success"
            trend={trends?.time_saved_month_change !== undefined ? {
              value: trends.time_saved_month_change,
              label: "since last month",
              isAbsolute: true,
              isMonetary: false
            } : undefined}
          />
          <MetricCard
            title="Money Saved This Month"
            value={`$${(metrics?.money_saved_month || 0).toLocaleString()}`}
            icon={DollarSign}
            variant="success"
            trend={trends?.money_saved_month_change !== undefined ? {
              value: trends.money_saved_month_change,
              label: "since last month",
              isAbsolute: true
            } : undefined}
          />
          <MetricCard
            title="Money Saved All Time"
            value={`$${(metrics?.money_saved_total || 0).toLocaleString()}`}
            icon={DollarSign}
            variant="success"
            trend={trends?.money_saved_total_change !== undefined ? {
              value: trends.money_saved_total_change,
              label: "this month's contribution",
              isAbsolute: true
            } : undefined}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard
            title="Total Executions This Month"
            value={metrics?.executions_month || 0}
            icon={Zap}
            trend={trends?.executions_change !== undefined ? {
              value: trends.executions_change,
              label: "since last month",
              isAbsolute: true,
              isMonetary: false
            } : undefined}
          />
          <MetricCard
            title="Current Managed Workflows"
            value={metrics?.managed_workflows || 0}
            icon={GitBranch}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <RevenueChart />
          <ExecutionsChart />
          <ExecutionStatusChart />
        </div>

        {/* Workflow Performance and Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <WorkflowPerformanceTable />
          <div className="space-y-6">
            <ActivityFeed />
            <ClientContactCard />
        </div>
      </div>
    </div>
    </div>
  );
};

export default Index;
