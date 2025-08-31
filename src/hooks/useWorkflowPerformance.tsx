import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface WorkflowPerformance {
  id: string;
  workflow_name: string;
  total_executions: number;
  success_rate: number;
  time_saved: number;
  money_saved: number;
}

export const useWorkflowPerformance = () => {
  const [data, setData] = useState<WorkflowPerformance[]>([]);
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
        'get-workflow-performance',
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
      console.error('Error fetching workflow performance:', err);
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

  return { data, loading, error, refetch: fetchData };
};