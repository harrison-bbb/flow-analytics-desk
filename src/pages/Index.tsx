import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ExecutionsChart } from "@/components/dashboard/ExecutionsChart";
import { useAuth } from "@/hooks/useAuth";
import { useUserMetrics } from "@/hooks/useUserMetrics";
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
  const { user, loading } = useAuth();
  const { metrics, loading: metricsLoading } = useUserMetrics();
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader />
        
        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="ROI"
            value={`${Math.round(metrics?.roi_percentage || 0)}%`}
            icon={TrendingUp}
            variant={metrics?.roi_percentage && metrics.roi_percentage > 0 ? "success" : "default"}
          />
          <MetricCard
            title="Time Saved This Month"
            value={`${metrics?.time_saved_month || 0}h`}
            icon={Clock}
            variant="success"
          />
          <MetricCard
            title="Money Saved This Month"
            value={`$${(metrics?.money_saved_month || 0).toLocaleString()}`}
            icon={DollarSign}
            variant="success"
          />
          <MetricCard
            title="Money Saved All Time"
            value={`$${(metrics?.money_saved_total || 0).toLocaleString()}`}
            icon={DollarSign}
            variant="success"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Total Executions This Month"
            value={metrics?.executions_month || 0}
            icon={Zap}
          />
          <MetricCard
            title="Current Managed Workflows"
            value={metrics?.managed_workflows || 0}
            icon={GitBranch}
          />
          <MetricCard
            title="API Usage"
            value={`${Math.round(metrics?.api_usage_percentage || 0)}%`}
            icon={Database}
            variant={metrics?.api_usage_percentage && metrics.api_usage_percentage > 80 ? "warning" : "default"}
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
