import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    console.log(`Fetching workflow performance for user: ${user.id}`);

    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get unique workflows from executions for this user (by workflow ID)
    const { data: uniqueWorkflows, error: workflowError } = await supabase
      .from('executions_log')
      .select('n8n_workflow_id, workflow_name')
      .eq('user_id', user.id)
      .gte('execution_date', `${currentMonth}-01`)
      .lt('execution_date', `${getNextMonth(currentMonth)}-01`)
      .not('n8n_workflow_id', 'is', null);

    if (workflowError) {
      console.error('Error fetching workflow data:', workflowError);
      throw workflowError;
    }

    // Get unique workflows by ID (use the most recent workflow name for each ID)
    const workflowMap = new Map();
    uniqueWorkflows?.forEach(w => {
      if (w.n8n_workflow_id) {
        workflowMap.set(w.n8n_workflow_id, w.workflow_name);
      }
    });
    
    const workflows = Array.from(workflowMap.entries()).map(([id, name]) => ({ id, name }));
    console.log(`Found ${workflows.length} unique workflows from executions`);

    // For each unique workflow, calculate performance metrics
    const workflowPerformance = await Promise.all(
      workflows.map(async (workflow) => {
        // Get executions for this workflow this month
        const { data: executions, error: execError } = await supabase
          .from('executions_log')
          .select('*')
          .eq('user_id', user.id)
          .eq('n8n_workflow_id', workflow.id)
          .gte('execution_date', `${currentMonth}-01`)
          .lt('execution_date', `${getNextMonth(currentMonth)}-01`);

        if (execError) {
          console.error('Error fetching executions:', execError);
          return {
            id: workflow.id,
            workflow_name: workflow.name,
            total_executions: 0,
            success_rate: 0,
            time_saved: 0,
            money_saved: 0,
          };
        }

        const totalExecutions = executions?.length || 0;
        const successfulExecutions = executions?.filter(e => e.execution_status === 'success').length || 0;
        const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
        const timeSaved = executions?.reduce((sum, e) => sum + (e.time_saved || 0), 0) || 0;
        const moneySaved = executions?.reduce((sum, e) => sum + (Number(e.money_saved) || 0), 0) || 0;

        return {
          id: workflow.id,
          workflow_name: workflow.name,
          total_executions: totalExecutions,
          success_rate: Math.round(successRate * 10) / 10, // Round to 1 decimal
          time_saved: timeSaved,
          money_saved: Number(moneySaved.toFixed(2)),
        };
      })
    );

    console.log('Workflow performance calculated:', workflowPerformance);

    return new Response(JSON.stringify(workflowPerformance), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-workflow-performance function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
}