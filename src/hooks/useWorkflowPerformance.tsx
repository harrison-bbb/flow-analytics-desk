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
  is_currently_managed: boolean;
  parent_workflow_id: string | null;
  db_id: string | null;
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

  const updateWorkflowManaged = async (workflowId: string, isManaged: boolean) => {
    if (!session?.access_token) return;

    try {
      const workflow = data.find(w => w.id === workflowId);
      if (!workflow?.db_id) {
        // Create workflow record if it doesn't exist
        const { error: insertError } = await supabase
          .from('workflows')
          .insert({
            user_id: user?.id,
            n8n_workflow_id: workflowId,
            workflow_name: workflow?.workflow_name || 'Unknown Workflow',
            is_currently_managed: isManaged
          });

        if (insertError) throw insertError;
      } else {
        // Update existing workflow
        const { error: updateError } = await supabase
          .from('workflows')
          .update({ is_currently_managed: isManaged })
          .eq('id', workflow.db_id);

        if (updateError) throw updateError;
      }

      // Refresh data to get updated managed status
      await fetchData();
    } catch (err) {
      console.error('Error updating workflow managed status:', err);
    }
  };

  const updateWorkflowParent = async (workflowId: string, parentId: string | null) => {
    if (!session?.access_token) return;

    try {
      const workflow = data.find(w => w.id === workflowId);
      if (!workflow?.db_id) {
        // Create workflow record if it doesn't exist
        const { error: insertError } = await supabase
          .from('workflows')
          .insert({
            user_id: user?.id,
            n8n_workflow_id: workflowId,
            workflow_name: workflow?.workflow_name || 'Unknown Workflow',
            parent_workflow_id: parentId
          });

        if (insertError) throw insertError;
      } else {
        // Update existing workflow
        const { error: updateError } = await supabase
          .from('workflows')
          .update({ parent_workflow_id: parentId })
          .eq('id', workflow.db_id);

        if (updateError) throw updateError;
      }

      // Refresh data to get updated parent relationship
      await fetchData();
    } catch (err) {
      console.error('Error updating workflow parent:', err);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData, 
    updateWorkflowManaged, 
    updateWorkflowParent 
  };
};