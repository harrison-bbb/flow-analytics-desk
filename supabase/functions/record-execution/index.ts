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

    // Recalculate user metrics after successful execution log insertion
    console.log('Recalculating user metrics for user:', user_id);
    
    const { error: recalcError } = await supabaseClient.rpc('recalculate_user_metrics_simple', {
      target_user_id: user_id
    });

    if (recalcError) {
      console.error('Error recalculating metrics:', recalcError);
      // Don't fail the whole operation if recalculation fails
      // The execution was still logged successfully
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
