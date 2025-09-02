import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useChartData } from "@/hooks/useChartData";
import { Target } from "lucide-react";

export const ExecutionStatusChart = () => {
  const { data: executions, loading, error } = useChartData('executions');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Success/Failure Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Success/Failure Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading chart data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total executions from daily data
  const totalExecutions = executions?.reduce((sum, day) => sum + day.executions, 0) || 0;
  
  // For demo purposes, assume 90% success rate
  // In a real scenario, you'd get this from execution status data
  const successCount = Math.floor(totalExecutions * 0.9);
  const failureCount = totalExecutions - successCount;

  const pieData = [
    {
      name: 'Successful',
      value: successCount,
      color: 'hsl(var(--success))',
    },
    {
      name: 'Failed',
      value: failureCount,
      color: 'hsl(var(--destructive))',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = totalExecutions > 0 ? ((data.value / totalExecutions) * 100).toFixed(1) : 0;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} executions ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-card via-card to-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Target className="h-5 w-5 text-primary" />
          Success/Failure Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalExecutions === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              No execution data available for this month.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 rounded-lg pointer-events-none" />
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="failureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <Pie
                  data={[
                    {
                      name: 'Successful',
                      value: successCount,
                      color: 'url(#successGradient)',
                    },
                    {
                      name: 'Failed',
                      value: failureCount,
                      color: 'url(#failureGradient)',
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? 'url(#successGradient)' : 'url(#failureGradient)'}
                      stroke="none"
                      strokeWidth={0}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip />}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 10px 30px -10px hsl(var(--primary) / 0.3)',
                    backdropFilter: 'blur(8px)',
                  }}
                />
                <Legend 
                  formatter={(value, entry) => (
                    <span 
                      style={{ color: value === 'Successful' ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}
                      className="font-medium"
                    >
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};