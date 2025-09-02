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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid token');
    }

    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Calculate previous month
    const prevMonthDate = new Date(currentDate);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const previousMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    console.log(`Fetching metrics for current month: ${currentMonth}, previous month: ${previousMonth}`);

    // Get current month metrics from executions_log (using same logic as chart)
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const nextMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    const { data: currentMonthData, error: currentError } = await supabaseClient
      .from('executions_log')
      .select('money_saved, time_saved')
      .eq('user_id', user.id)
      .gte('execution_date', currentMonthStart.toISOString())
      .lt('execution_date', nextMonthStart.toISOString());

    if (currentError) {
      console.error('Error fetching current month data:', currentError);
      throw currentError;
    }

    // Get previous month metrics from executions_log (using same logic as chart)
    const previousMonthStart = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
    
    const { data: previousMonthData, error: previousError } = await supabaseClient
      .from('executions_log')
      .select('money_saved, time_saved')
      .eq('user_id', user.id)
      .gte('execution_date', previousMonthStart.toISOString())
      .lt('execution_date', currentMonthStart.toISOString());

    if (previousError) {
      console.error('Error fetching previous month data:', previousError);
      throw previousError;
    }

    // Calculate current month totals
    const currentMonthMoney = currentMonthData?.reduce((sum, record) => sum + (parseFloat(record.money_saved || '0')), 0) || 0;
    const currentMonthTime = currentMonthData?.reduce((sum, record) => sum + (record.time_saved || 0), 0) || 0;
    const currentMonthExecutions = currentMonthData?.length || 0;

    // Calculate previous month totals
    const previousMonthMoney = previousMonthData?.reduce((sum, record) => sum + (parseFloat(record.money_saved || '0')), 0) || 0;
    const previousMonthTime = previousMonthData?.reduce((sum, record) => sum + (record.time_saved || 0), 0) || 0;
    const previousMonthExecutions = previousMonthData?.length || 0;

    // Get total money saved for ROI calculation
    const { data: totalData, error: totalError } = await supabaseClient
      .from('executions_log')
      .select('money_saved')
      .eq('user_id', user.id);

    if (totalError) {
      console.error('Error fetching total data:', totalError);
      throw totalError;
    }

    const totalMoneySaved = totalData?.reduce((sum, record) => sum + (parseFloat(record.money_saved || '0')), 0) || 0;
    const previousTotalMoney = totalMoneySaved - currentMonthMoney;

    // Get user's current plan cost for ROI calculation
    const { data: userSubscription } = await supabaseClient
      .from('user_subscriptions')
      .select(`
        plan:subscription_plans(monthly_cost_aud)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    
    const planCost = userSubscription?.plan?.monthly_cost_aud || 3500; // Default to Growth Engine

    // Only calculate meaningful trends if there's previous month data
    let trends = null;
    
    if (previousMonthExecutions > 0) {
      // Calculate ROI changes using plan-based calculation
      const currentMonthROI = planCost > 0 ? 
        ((currentMonthMoney - planCost) / planCost) * 100 : 0;
      const previousMonthROI = planCost > 0 ? 
        ((previousMonthMoney - planCost) / planCost) * 100 : 0;
      
      trends = {
        money_saved_month_change: currentMonthMoney - previousMonthMoney,
        money_saved_total_change: currentMonthMoney, // This month's contribution to total
        time_saved_month_change: currentMonthTime - previousMonthTime,
        roi_change: currentMonthROI - previousMonthROI,
        executions_change: currentMonthExecutions - previousMonthExecutions
      };
    }

    console.log('Final calculated values:', {
      currentMonthMoney,
      currentMonthTime,
      currentMonthExecutions,
      trends
    });

    return new Response(
      JSON.stringify({ 
        trends,
        currentMonthMoney,
        currentMonthTime,
        currentMonthExecutions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-monthly-trends function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});