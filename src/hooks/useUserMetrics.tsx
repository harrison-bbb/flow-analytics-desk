import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserMetrics {
  roi_percentage: number;
  time_saved_month: number;
  money_saved_month: number;
  money_saved_total: number;
  executions_month: number;
  managed_workflows: number;
  api_usage_percentage: number;
}

export const useUserMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setMetrics({
          roi_percentage: Number(data.roi_percentage) || 0,
          time_saved_month: data.time_saved_month || 0,
          money_saved_month: Number(data.money_saved_month) || 0,
          money_saved_total: Number(data.money_saved_total) || 0,
          executions_month: data.executions_month || 0,
          managed_workflows: data.managed_workflows || 0,
          api_usage_percentage: Number(data.api_usage_percentage) || 0,
        });
      } else {
        // Create default metrics if none exist
        setMetrics({
          roi_percentage: 0,
          time_saved_month: 0,
          money_saved_month: 0,
          money_saved_total: 0,
          executions_month: 0,
          managed_workflows: 0,
          api_usage_percentage: 0,
        });
      }
    } catch (err) {
      console.error('Error fetching user metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-metrics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_metrics',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time metrics update:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            setMetrics({
              roi_percentage: Number(payload.new.roi_percentage) || 0,
              time_saved_month: payload.new.time_saved_month || 0,
              money_saved_month: Number(payload.new.money_saved_month) || 0,
              money_saved_total: Number(payload.new.money_saved_total) || 0,
              executions_month: payload.new.executions_month || 0,
              managed_workflows: payload.new.managed_workflows || 0,
              api_usage_percentage: Number(payload.new.api_usage_percentage) || 0,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { metrics, loading, error, refetch: fetchMetrics };
};