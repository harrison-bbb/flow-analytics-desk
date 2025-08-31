import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, TrendingUp } from "lucide-react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useUserMetrics } from "@/hooks/useUserMetrics";
import { formatDistanceToNow } from "date-fns";

export const SubscriptionOverview = () => {
  const { userSubscription, loading } = useSubscriptionPlans();
  const { metrics } = useUserMetrics();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading subscription details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!userSubscription?.plan) {
    return (
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <DollarSign className="w-5 h-5" />
            No Active Subscription
          </CardTitle>
          <CardDescription>
            You need a subscription plan to calculate accurate ROI metrics.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const plan = userSubscription.plan;
  const startedAt = new Date(userSubscription.started_at);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateMonthlyROI = () => {
    if (!metrics) return null;
    
    const monthlySavings = metrics.money_saved_month;
    const planCost = plan.monthly_cost_aud;
    
    if (planCost <= 0) return null;
    
    const roi = ((monthlySavings - planCost) / planCost) * 100;
    return roi;
  };

  const calculateNetMonthlySavings = () => {
    if (!metrics) return 0;
    return metrics.money_saved_month - plan.monthly_cost_aud;
  };

  const monthlyROI = calculateMonthlyROI();
  const netMonthlySavings = calculateNetMonthlySavings();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(plan.monthly_cost_aud)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
            </div>
            <Badge variant="outline" className="border-primary text-primary">
              Active
            </Badge>
          </div>
          
          {plan.description && (
            <p className="text-sm text-muted-foreground">
              {plan.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Started {formatDistanceToNow(startedAt, { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            ROI Performance
          </CardTitle>
          <CardDescription>
            Based on your current subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics && monthlyROI !== null ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gross Monthly Savings</span>
                  <span className="font-medium">
                    {formatPrice(metrics.money_saved_month)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan Cost</span>
                  <span className="font-medium">
                    -{formatPrice(plan.monthly_cost_aud)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Net Monthly Savings</span>
                  <span className={`font-medium ${
                    netMonthlySavings >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {formatPrice(netMonthlySavings)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly ROI</span>
                    <span className={`font-bold text-lg ${
                      monthlyROI > 0 ? 'text-success' : 
                      monthlyROI < 0 ? 'text-destructive' : 
                      'text-muted-foreground'
                    }`}>
                      {monthlyROI > 0 ? '+' : ''}{monthlyROI.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                ROI = (Monthly Savings - Plan Cost) / Plan Cost × 100
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm">
              No execution data available for ROI calculation
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};