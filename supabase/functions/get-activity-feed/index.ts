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

    console.log(`Fetching activity feed for user: ${user.id}`);

    // Get the 5 most recent executions
    const { data: executions, error } = await supabase
      .from('executions_log')
      .select('*')
      .eq('user_id', user.id)
      .order('execution_date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching executions:', error);
      throw error;
    }

    console.log(`Found ${executions?.length || 0} recent executions`);

    // Format the activity feed
    const activityFeed = (executions || []).map(execution => {
      const isSuccess = execution.execution_status === 'success';
      let details = execution.execution_details;
      
      // Generate default details if none provided
      if (!details) {
        if (isSuccess) {
          details = `Successfully executed workflow. Saved ${execution.time_saved || 0} minutes and $${execution.money_saved || 0}.`;
        } else {
          details = `Workflow execution failed. Please check the configuration.`;
        }
      }

      return {
        id: execution.id,
        workflow_name: execution.workflow_name,
        status: isSuccess ? 'Success' : 'Failure',
        timestamp: execution.execution_date,
        details: details,
        time_saved: execution.time_saved || 0,
        money_saved: Number(execution.money_saved) || 0,
      };
    });

    return new Response(JSON.stringify(activityFeed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-activity-feed function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});