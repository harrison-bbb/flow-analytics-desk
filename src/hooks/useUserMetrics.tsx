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

export interface MonthlyTrends {
  money_saved_month_change: number;
  money_saved_total_change: number;
  time_saved_month_change: number;
  roi_change: number;
  executions_change: number;
}

export const useUserMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [trends, setTrends] = useState<MonthlyTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch current metrics
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
          roi_percentage: 0, // Will be calculated from monthly data
          time_saved_month: data.time_saved_month || 0,
          money_saved_month: Number(data.money_saved_month) || 0,
          money_saved_total: Number(data.money_saved_total) || 0,
          executions_month: data.executions_month || 0,
          managed_workflows: data.managed_workflows || 0,
          api_usage_percentage: 0, // This field doesn't exist in new schema
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

      // Fetch monthly trends and update metrics with correct monthly totals
      const { data: trendsData, error: trendsError } = await supabase.functions.invoke('get-monthly-trends');
      
      if (trendsError) {
        console.error('Error fetching trends:', trendsError);
      } else if (trendsData?.trends) {
        setTrends(trendsData.trends);
        
        // Update metrics with the correct monthly totals from trends calculation
        const currentMonthMoney = trendsData.currentMonthMoney || 0;
        const currentMonthTime = trendsData.currentMonthTime || 0;
        const currentMonthExecutions = trendsData.currentMonthExecutions || 0;
        
        setMetrics(prev => prev ? {
          ...prev,
          money_saved_month: currentMonthMoney,
          time_saved_month: currentMonthTime,
          executions_month: currentMonthExecutions,
          roi_percentage: 0, // Will be calculated by components using monthly data
        } : {
          roi_percentage: 0, // Will be calculated by components using monthly data
          time_saved_month: currentMonthTime,
          money_saved_month: currentMonthMoney,
          money_saved_total: Number(data?.money_saved_total) || 0,
          executions_month: currentMonthExecutions,
          managed_workflows: data?.managed_workflows || 0,
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
    
    // Listen for custom events to refresh metrics
    const handleMetricsUpdate = () => {
      console.log('Refreshing metrics due to subscription change');
      fetchMetrics();
    };
    
    window.addEventListener('userMetricsUpdated', handleMetricsUpdate);
    
    return () => {
      window.removeEventListener('userMetricsUpdated', handleMetricsUpdate);
    };
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
            // Only update certain fields from real-time, keep live-calculated fields
            setMetrics(prev => prev ? {
              ...prev,
              roi_percentage: 0, // Will be calculated by components using monthly data
              money_saved_total: Number(payload.new.money_saved_total) || 0,
              managed_workflows: payload.new.managed_workflows || 0,
              // Don't update monthly fields - they come from live trends calculation
            } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { metrics, trends, loading, error, refetch: fetchMetrics };
};