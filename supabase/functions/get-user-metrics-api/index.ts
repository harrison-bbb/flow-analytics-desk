import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserMetricsResponse {
  current_month: {
    time_saved: number;
    money_saved: number;
    total_executions: number;
    roi_percentage: number;
  };
  previous_month: {
    roi_percentage: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the auth token
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching metrics for user: ${user.id}`);

    // Get current and previous month dates
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    console.log(`Fetching metrics for current month: ${currentMonth}, previous month: ${previousMonth}`);

    // Fetch current month executions
    const { data: currentMonthData, error: currentError } = await supabaseClient
      .from('executions_log')
      .select('time_saved, money_saved')
      .eq('user_id', user.id)
      .gte('execution_date', `${currentMonth}-01`)
      .lt('execution_date', `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`);

    if (currentError) {
      console.error('Error fetching current month data:', currentError);
      throw currentError;
    }

    // Fetch previous month executions
    const { data: previousMonthData, error: previousError } = await supabaseClient
      .from('executions_log')
      .select('time_saved, money_saved')
      .eq('user_id', user.id)
      .gte('execution_date', `${previousMonth}-01`)
      .lt('execution_date', `${currentMonth}-01`);

    if (previousError) {
      console.error('Error fetching previous month data:', previousError);
      throw previousError;
    }

    // Get user's plan cost
    const { data: subscriptionData, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select(`
        subscription_plans (
          monthly_cost_aud
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1);

    if (subError) {
      console.error('Error fetching subscription:', subError);
    }

    const planCost = subscriptionData?.[0]?.subscription_plans?.monthly_cost_aud || 3500; // Default to Growth Engine

    // Calculate current month metrics
    const currentMonthTimeSaved = currentMonthData?.reduce((sum, exec) => sum + (Number(exec.time_saved) || 0), 0) || 0;
    const currentMonthMoneySaved = currentMonthData?.reduce((sum, exec) => sum + (Number(exec.money_saved) || 0), 0) || 0;
    const currentMonthExecutions = currentMonthData?.length || 0;

    // Calculate previous month metrics
    const previousMonthMoneySaved = previousMonthData?.reduce((sum, exec) => sum + (Number(exec.money_saved) || 0), 0) || 0;

    // Calculate ROI percentages
    const currentMonthROI = currentMonthMoneySaved > 0 ? 
      ((currentMonthMoneySaved - planCost) / planCost) * 100 : 0;
    
    const previousMonthROI = previousMonthMoneySaved > 0 ? 
      ((previousMonthMoneySaved - planCost) / planCost) * 100 : 0;

    console.log(`Current month: ${currentMonthExecutions} executions, $${currentMonthMoneySaved} saved, ${currentMonthTimeSaved} time saved, ${currentMonthROI.toFixed(2)}% ROI`);
    console.log(`Previous month: $${previousMonthMoneySaved} saved, ${previousMonthROI.toFixed(2)}% ROI`);

    const response: UserMetricsResponse = {
      current_month: {
        time_saved: currentMonthTimeSaved,
        money_saved: currentMonthMoneySaved,
        total_executions: currentMonthExecutions,
        roi_percentage: Math.round(currentMonthROI * 100) / 100, // Round to 2 decimal places
      },
      previous_month: {
        roi_percentage: Math.round(previousMonthROI * 100) / 100, // Round to 2 decimal places
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-user-metrics-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});