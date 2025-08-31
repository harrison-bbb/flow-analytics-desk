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

    const { type = 'executions' } = await req.json().catch(() => ({}));

    if (type === 'executions') {
      // Get daily executions for the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);

      console.log(`Fetching executions from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const { data: executions, error: execError } = await supabaseClient
        .from('executions_log')
        .select('execution_date')
        .eq('user_id', user.id)
        .gte('execution_date', startDate.toISOString())
        .lte('execution_date', endDate.toISOString());

      if (execError) {
        console.error('Error fetching executions:', execError);
        throw execError;
      }

      console.log(`Found ${executions?.length || 0} executions`);
      console.log('Executions data:', executions);

      // Group by day
      const dailyData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Use date only comparison (YYYY-MM-DD format)
        const targetDateStr = date.toISOString().split('T')[0];
        
        // Count executions for this specific date
        const count = executions?.filter(exec => {
          const execDateStr = new Date(exec.execution_date).toISOString().split('T')[0];
          console.log(`Comparing ${execDateStr} with ${targetDateStr}`);
          return execDateStr === targetDateStr;
        }).length || 0;

        console.log(`${dayStr} (${targetDateStr}): ${count} executions`);

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
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 5);
      startDate.setDate(1); // First day of 6 months ago

      console.log(`Fetching savings from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const { data: savingsData, error: savingsError } = await supabaseClient
        .from('executions_log')
        .select('execution_date, money_saved')
        .eq('user_id', user.id)
        .gte('execution_date', startDate.toISOString())
        .lte('execution_date', endDate.toISOString())
        .order('execution_date', { ascending: true });

      if (savingsError) {
        console.error('Error fetching savings:', savingsError);
        throw savingsError;
      }

      console.log(`Found ${savingsData?.length || 0} savings records`);

      // Group by month and calculate totals
      const monthlyData: { [key: string]: { savings: number; executions: number } } = {};
      
      // Initialize all 6 months with zero data
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = { savings: 0, executions: 0 };
      }
      
      savingsData?.forEach(log => {
        const date = new Date(log.execution_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].savings += parseFloat(log.money_saved || '0');
          monthlyData[monthKey].executions += 1;
        }
      });

      // Convert to array format expected by the chart with proper month names
      const chartData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, data]) => {
          const [year, monthNum] = monthKey.split('-');
          const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { 
            month: 'short',
            year: 'numeric'
          });
          
          console.log(`${monthName}: $${data.savings} from ${data.executions} executions`);
          
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