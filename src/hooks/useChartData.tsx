import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ExecutionChartData {
  day: string;
  executions: number;
}

export interface SavingsChartData {
  month: string;
  savings: number;
  executions: number;
}

export const useChartData = (type: 'executions' | 'savings') => {
  const { session } = useAuth();
  const [data, setData] = useState<ExecutionChartData[] | SavingsChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      setError(null);

      const { data: chartData, error: fetchError } = await supabase.functions.invoke(
        'get-chart-data',
        {
          body: { type },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (fetchError) {
        throw fetchError;
      }

      setData(chartData.data || []);
    } catch (err) {
      console.error(`Error fetching ${type} chart data:`, err);
      setError(err instanceof Error ? err.message : `Failed to fetch ${type} data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session?.access_token, type]);

  // Set up real-time subscription for executions
  useEffect(() => {
    if (!session?.user?.id || type !== 'executions') return;

    const channel = supabase
      .channel('executions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'executions_log',
          filter: `user_id=eq.${session.user.id}`
        },
        () => {
          console.log('New execution logged, refreshing chart data');
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, type]);

  return { data, loading, error, refetch: fetchData };
};