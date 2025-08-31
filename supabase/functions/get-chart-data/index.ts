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
        
        const count = executions?.filter(exec => {
          const execDate = new Date(exec.execution_date);
          const execDateStr = execDate.toISOString().split('T')[0];
          return execDateStr === dateStr;
        }).length || 0;

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
      // Get monthly savings data for the last 6 months
      const { data: savingsData, error: savingsError } = await supabaseClient
        .from('executions_log')
        .select('execution_date, money_saved')
        .eq('user_id', user.id)
        .gte('execution_date', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('execution_date', { ascending: true });

      if (savingsError) {
        throw savingsError;
      }

      // Group by month and calculate totals
      const monthlyData: { [key: string]: { savings: number; executions: number } } = {};
      
      savingsData?.forEach(log => {
        const date = new Date(log.execution_date);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[month]) {
          monthlyData[month] = { savings: 0, executions: 0 };
        }
        
        monthlyData[month].savings += parseFloat(log.money_saved || 0);
        monthlyData[month].executions += 1;
      });

      // Convert to array format expected by the chart with proper month names
      const chartData = Object.entries(monthlyData).map(([month, data]) => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        return {
          month: monthName,
          savings: Math.round(data.savings),
          executions: data.executions
        };
      });

      return new Response(
        JSON.stringify({ data: chartData }),
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