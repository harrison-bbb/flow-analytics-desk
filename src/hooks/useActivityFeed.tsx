import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ActivityItem {
  id: string;
  workflow_name: string;
  status: 'Success' | 'Failure';
  timestamp: string;
  details: string;
  time_saved: number;
  money_saved: number;
}

export const useActivityFeed = () => {
  const [data, setData] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();

  const fetchData = async () => {
    if (!session?.access_token) {
      setError("No valid session");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: result, error: invokeError } = await supabase.functions.invoke(
        'get-activity-feed',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (invokeError) {
        throw invokeError;
      }

      setData(result || []);
    } catch (err) {
      console.error('Error fetching activity feed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && session) {
      fetchData();
    }
  }, [user, session]);

  // Set up real-time subscription for new executions
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('activity-feed-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'executions_log',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('New execution detected, refreshing activity feed');
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { data, loading, error, refetch: fetchData };
};