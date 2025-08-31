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

    // Get current month metrics from executions_log
    const { data: currentMonthData, error: currentError } = await supabaseClient
      .from('executions_log')
      .select('money_saved, time_saved')
      .eq('user_id', user.id)
      .gte('execution_date', `${currentMonth}-01`)
      .lt('execution_date', `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 2).padStart(2, '0')}-01`);

    if (currentError) {
      console.error('Error fetching current month data:', currentError);
      throw currentError;
    }

    // Get previous month metrics from executions_log
    const { data: previousMonthData, error: previousError } = await supabaseClient
      .from('executions_log')
      .select('money_saved, time_saved')
      .eq('user_id', user.id)
      .gte('execution_date', `${previousMonth}-01`)
      .lt('execution_date', `${currentMonth}-01`);

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

    // Calculate ROI for current and previous periods
    const currentROI = currentMonthExecutions > 0 ? ((totalMoneySaved - (currentMonthExecutions * 10)) / (currentMonthExecutions * 10)) * 100 : 0;
    const previousROI = previousMonthExecutions > 0 ? ((previousTotalMoney - (previousMonthExecutions * 10)) / (previousMonthExecutions * 10)) * 100 : 0;

    // Calculate changes
    const moneyChange = currentMonthMoney - previousMonthMoney;
    const timeChange = currentMonthTime - previousMonthTime;
    const roiChange = currentROI - previousROI;
    const totalMoneyChange = totalMoneySaved - previousTotalMoney;

    console.log('Calculated trends:', {
      currentMonthMoney,
      previousMonthMoney,
      moneyChange,
      timeChange,
      roiChange,
      totalMoneyChange
    });

    return new Response(
      JSON.stringify({
        trends: {
          money_saved_month_change: moneyChange,
          money_saved_total_change: totalMoneyChange,
          time_saved_month_change: timeChange,
          roi_change: roiChange,
          executions_change: currentMonthExecutions - previousMonthExecutions
        }
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