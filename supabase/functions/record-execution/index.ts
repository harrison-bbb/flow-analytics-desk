import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation function
function validateExecutionInput(body: any) {
  const errors = [];
  
  if (!body.user_id) {
    errors.push('user_id is required');
  } else if (typeof body.user_id !== 'string') {
    errors.push('user_id must be a string');
  }
  
  if (!body.workflow_name) {
    errors.push('workflow_name is required');
  } else if (typeof body.workflow_name !== 'string') {
    errors.push('workflow_name must be a string');
  }
  
  if (body.time_saved !== undefined && body.time_saved !== null) {
    const timeSaved = Number(body.time_saved);
    if (isNaN(timeSaved) || timeSaved < 0 || timeSaved > 999999) {
      errors.push('time_saved must be a number between 0 and 999999');
    }
  }
  
  if (body.money_saved !== undefined && body.money_saved !== null) {
    const moneySaved = Number(body.money_saved);
    if (isNaN(moneySaved) || moneySaved < 0 || moneySaved > 99999999) {
      errors.push('money_saved must be a number between 0 and 99999999');
    }
  }
  
  return errors;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate input
    const validationErrors = validateExecutionInput(body);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: validationErrors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { 
      user_id, 
      workflow_name, 
      n8n_workflow_id, 
      time_saved = 0, 
      money_saved = 0, 
      execution_status = 'Success',
      automation_type = 'automation',
      metadata = {}
    } = body;

    // Convert and validate numbers
    const timeSavedNum = Number(time_saved);
    const moneySavedNum = Number(money_saved);

    console.log('Recording execution:', { 
      user_id, 
      workflow_name, 
      execution_status,
      time_saved: timeSavedNum, 
      money_saved: moneySavedNum 
    });

    // Insert execution log with validated numbers
    const { error: logError } = await supabaseClient
      .from('executions_log')
      .insert({
        user_id,
        workflow_name,
        n8n_workflow_id,
        time_saved: timeSavedNum,
        money_saved: moneySavedNum,
        execution_status: execution_status || 'Success', // Ensure it's never null
        automation_type,
        metadata
      });

    if (logError) {
      console.error('Error inserting execution log:', logError);
      
      // Provide more specific error messages
      if (logError.code === '22003') {
        return new Response(
          JSON.stringify({ 
            error: 'Numeric value overflow',
            details: 'One of the numeric values (time_saved, money_saved) is too large. Please use smaller values.',
            field_limits: {
              time_saved: 'max 999999.99',
              money_saved: 'max 99999999.99'
            }
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw logError;
    }

    // Update or create user metrics
    const { data: existingMetrics, error: metricsError } = await supabaseClient
      .from('user_metrics')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (metricsError) {
      console.error('Error fetching user metrics:', metricsError);
      throw metricsError;
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const lastUpdated = existingMetrics?.last_updated 
      ? new Date(existingMetrics.last_updated).toISOString().slice(0, 7)
      : null;

    // Reset monthly counters if it's a new month
    const resetMonthly = lastUpdated !== currentMonth;

    if (existingMetrics) {
      // Update existing metrics
      const newExecutionsMonth = resetMonthly ? 1 : (existingMetrics.executions_month || 0) + 1;
      const newMoneySavedTotal = (existingMetrics.money_saved_total || 0) + moneySavedNum;
      
      const updatedMetrics = {
        time_saved_month: resetMonthly ? timeSavedNum : (existingMetrics.time_saved_month || 0) + timeSavedNum,
        money_saved_month: resetMonthly ? moneySavedNum : (existingMetrics.money_saved_month || 0) + moneySavedNum,
        money_saved_total: newMoneySavedTotal,
        executions_month: newExecutionsMonth,
        roi_percentage: calculateROI(newMoneySavedTotal, newExecutionsMonth),
        last_updated: new Date().toISOString()
      };

      const { error: updateError } = await supabaseClient
        .from('user_metrics')
        .update(updatedMetrics)
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Error updating metrics:', updateError);
        
        if (updateError.code === '22003') {
          return new Response(
            JSON.stringify({ 
              error: 'Metric calculation overflow',
              details: 'The calculated metrics would exceed database limits. This often happens with very large ROI calculations.',
              suggestion: 'Please contact support if you continue seeing this error.'
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        throw updateError;
      }
    } else {
      // Create new metrics record
      const roi = calculateROI(moneySavedNum, 1);
      
      const { error: insertError } = await supabaseClient
        .from('user_metrics')
        .insert({
          user_id,
          time_saved_month: timeSavedNum,
          money_saved_month: moneySavedNum,
          money_saved_total: moneySavedNum,
          executions_month: 1,
          roi_percentage: roi,
          managed_workflows: 1
        });

      if (insertError) {
        console.error('Error creating metrics:', insertError);
        
        if (insertError.code === '22003') {
          return new Response(
            JSON.stringify({ 
              error: 'Metric calculation overflow',
              details: 'The calculated metrics would exceed database limits.',
              field_limits: {
                roi_percentage: 'max 999999.99%',
                money_saved: 'max 999999999999.99'
              }
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
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
  if (executions <= 0 || totalSaved <= 0) {
    return 0;
  }
  
  // Calculate ROI with safe bounds to prevent database overflow
  // Assumes $10 cost per execution as baseline
  const costBasis = executions * 10;
  const roi = ((totalSaved - costBasis) / costBasis) * 100;
  
  // Cap ROI between -100% and 99999% to prevent numeric overflow (new database limit is 999999.99)
  // Round to 2 decimal places for precision
  return Math.max(-100, Math.min(99999, Math.round(roi * 100) / 100));
}