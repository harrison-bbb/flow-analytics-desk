import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      user_id, 
      workflow_name, 
      n8n_workflow_id, 
      time_saved = 0, 
      money_saved = 0, 
      automation_type = 'automation',
      metadata = {}
    } = await req.json();

    console.log('Recording execution:', { user_id, workflow_name, time_saved, money_saved });

    // Insert execution log
    const { error: logError } = await supabaseClient
      .from('executions_log')
      .insert({
        user_id,
        workflow_name,
        n8n_workflow_id,
        time_saved,
        money_saved,
        automation_type,
        metadata
      });

    if (logError) {
      console.error('Error inserting execution log:', logError);
      throw logError;
    }

    // Update or create user metrics
    const { data: existingMetrics } = await supabaseClient
      .from('user_metrics')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const lastUpdated = existingMetrics?.last_updated 
      ? new Date(existingMetrics.last_updated).toISOString().slice(0, 7)
      : null;

    // Reset monthly counters if it's a new month
    const resetMonthly = lastUpdated !== currentMonth;

    if (existingMetrics) {
      // Update existing metrics
      const updatedMetrics = {
        time_saved_month: resetMonthly ? time_saved : (existingMetrics.time_saved_month || 0) + time_saved,
        money_saved_month: resetMonthly ? money_saved : (existingMetrics.money_saved_month || 0) + money_saved,
        money_saved_total: (existingMetrics.money_saved_total || 0) + money_saved,
        executions_month: resetMonthly ? 1 : (existingMetrics.executions_month || 0) + 1,
        roi_percentage: calculateROI(
          (existingMetrics.money_saved_total || 0) + money_saved,
          (existingMetrics.executions_month || 0) + 1
        ),
        last_updated: new Date().toISOString()
      };

      const { error: updateError } = await supabaseClient
        .from('user_metrics')
        .update(updatedMetrics)
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Error updating metrics:', updateError);
        throw updateError;
      }
    } else {
      // Create new metrics record
      const { error: insertError } = await supabaseClient
        .from('user_metrics')
        .insert({
          user_id,
          time_saved_month: time_saved,
          money_saved_month: money_saved,
          money_saved_total: money_saved,
          executions_month: 1,
          roi_percentage: calculateROI(money_saved, 1),
          managed_workflows: 1
        });

      if (insertError) {
        console.error('Error creating metrics:', insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Execution recorded successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in record-execution function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function calculateROI(totalSaved: number, executions: number): number {
  // Simple ROI calculation - this can be customized based on business logic
  const estimatedCost = executions * 10; // Assume $10 cost per execution
  const roi = totalSaved > 0 ? ((totalSaved - estimatedCost) / estimatedCost) * 100 : 0;
  // Cap ROI at 999 to prevent numeric overflow
  return Math.min(999, Math.max(-999, roi));
}