import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthly_cost_aud: number;
  description: string | null;
  features: any | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  plan?: SubscriptionPlan;
}

export const useSubscriptionPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const { data, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_cost_aud', { ascending: true });

      if (plansError) throw plansError;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    }
  };

  const fetchUserSubscription = async () => {
    if (!user?.id) return;

    try {
      const { data, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (subError) throw subError;
      setUserSubscription(data);
    } catch (err) {
      console.error('Error fetching user subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    }
  };

  const assignUserToPlan = async (planId: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setLoading(true);
      
      // End current subscription if exists
      if (userSubscription) {
        await supabase
          .from('user_subscriptions')
          .update({ 
            ended_at: new Date().toISOString(),
            is_active: false 
          })
          .eq('id', userSubscription.id);
      }

      // Create new subscription
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          is_active: true
        })
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .single();

      if (error) throw error;
      
      setUserSubscription(data);
      
      // Recalculate user metrics with new plan
      const { error: recalcError } = await supabase.functions.invoke('recalculate-user-metrics', {
        body: { user_id: user.id }
      });

      if (recalcError) {
        console.error('Error recalculating metrics:', recalcError);
      }

      // Trigger refresh of user metrics in the parent component
      // This will be handled by real-time subscription or manual refetch
      window.dispatchEvent(new CustomEvent('userMetricsUpdated'));

      return data;
    } catch (err) {
      console.error('Error assigning plan:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPlans(), fetchUserSubscription()]);
      setLoading(false);
    };

    loadData();
  }, [user?.id]);

  return {
    plans,
    userSubscription,
    loading,
    error,
    assignUserToPlan,
    refetch: () => Promise.all([fetchPlans(), fetchUserSubscription()])
  };
};