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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

    const { type = 'executions' } = await req.json().catch(() => ({}));

    if (type === 'executions') {
      // Get daily executions for the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);

      const { data: executions } = await supabaseClient
        .from('executions_log')
        .select('execution_date')
        .eq('user_id', user.id)
        .gte('execution_date', startDate.toISOString())
        .lte('execution_date', endDate.toISOString());

      // Group by day
      const dailyData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toISOString().split('T')[0];
        
        const count = executions?.filter(exec => 
          exec.execution_date.split('T')[0] === dateStr
        ).length || 0;

        dailyData.push({
          day: dayStr,
          executions: count
        });
      }

      return new Response(
        JSON.stringify({ data: dailyData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (type === 'savings') {
      // Get monthly savings for the last 6 months
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
        const yearMonth = date.toISOString().slice(0, 7);

        // Calculate the last day of the month properly
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const lastDay = new Date(nextMonth.getTime() - 1).toISOString().slice(0, 10);
        
        const { data: monthlyExecutions } = await supabaseClient
          .from('executions_log')
          .select('money_saved')
          .eq('user_id', user.id)
          .gte('execution_date', `${yearMonth}-01`)
          .lte('execution_date', `${lastDay}T23:59:59.999Z`);

        const savings = monthlyExecutions?.reduce((sum, exec) => 
          sum + (Number(exec.money_saved) || 0), 0
        ) || 0;

        const executions = monthlyExecutions?.length || 0;

        monthlyData.push({
          month: monthStr,
          savings: Math.round(savings),
          executions
        });
      }

      return new Response(
        JSON.stringify({ data: monthlyData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in get-chart-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});