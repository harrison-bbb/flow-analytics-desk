import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { Users, Settings } from "lucide-react";

interface UserAssignment {
  userId: string;
  email: string;
}

export const AdminPlanManager = () => {
  const { plans, loading, refetch } = useSubscriptionPlans();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const handleAssignPlan = async () => {
    if (!userEmail || !selectedPlanId) {
      toast({
        title: "Missing Information",
        description: "Please enter a user ID and select a plan",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssigning(true);

      // For now, we'll assume the userEmail is actually a user ID
      // since we can't access auth.users table directly
      const userId = userEmail;

      // End current subscription if exists
      const { error: endError } = await supabase
        .from('user_subscriptions')
        .update({ 
          ended_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (endError) throw endError;

      // Create new subscription
      const { error: assignError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: selectedPlanId,
          is_active: true
        });

      if (assignError) throw assignError;

      // Recalculate user metrics
      await supabase.functions.invoke('recalculate-user-metrics', {
        body: { user_id: userId }
      });

      toast({
        title: "Plan Assigned",
        description: `Successfully assigned plan to ${userEmail}`,
      });

      setUserEmail("");
      setSelectedPlanId("");
      
    } catch (error) {
      console.error('Error assigning plan:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign plan to user",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Plan Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Plan Manager
          </CardTitle>
          <CardDescription>
            Assign subscription plans to users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userEmail">User ID</Label>
              <Input
                id="userEmail"
                type="text"
                placeholder="user-uuid-here"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="planSelect">Subscription Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {formatPrice(plan.monthly_cost_aud)}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleAssignPlan}
            disabled={assigning || !userEmail || !selectedPlanId}
            className="w-full md:w-auto"
          >
            {assigning ? "Assigning..." : "Assign Plan"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Available Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-muted">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(plan.monthly_cost_aud)}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};