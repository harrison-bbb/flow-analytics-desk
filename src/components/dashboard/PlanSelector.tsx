import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { SubscriptionPlan, useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface PlanSelectorProps {
  onPlanSelected?: (plan: SubscriptionPlan) => void;
}

export const PlanSelector = ({ onPlanSelected }: PlanSelectorProps) => {
  const { plans, userSubscription, assignUserToPlan } = useSubscriptionPlans();
  const { toast } = useToast();
  const [assigningPlan, setAssigningPlan] = useState<string | null>(null);

  const handlePlanSelection = async (plan: SubscriptionPlan) => {
    try {
      setAssigningPlan(plan.id);
      await assignUserToPlan(plan.id);
      
      toast({
        title: "Plan Updated",
        description: `Successfully switched to ${plan.name}`,
      });
      
      onPlanSelected?.(plan);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription plan",
        variant: "destructive",
      });
    } finally {
      setAssigningPlan(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const currentPlanId = userSubscription?.plan?.id;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrentPlan = currentPlanId === plan.id;
        const isAssigning = assigningPlan === plan.id;
        
        return (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-200 ${
              isCurrentPlan 
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                : 'hover:border-primary/50'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {isCurrentPlan && (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    <Check className="w-3 h-3 mr-1" />
                    Current
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-primary">
                {formatPrice(plan.monthly_cost_aud)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
              {plan.description && (
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-4">
                {plan.features && (
                  <ul className="space-y-2 text-sm">
                    {(plan.features as string[]).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                <Button
                  onClick={() => handlePlanSelection(plan)}
                  disabled={isCurrentPlan || isAssigning}
                  className="w-full"
                  variant={isCurrentPlan ? "secondary" : "default"}
                >
                  {isAssigning ? (
                    "Switching..."
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    "Select Plan"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};