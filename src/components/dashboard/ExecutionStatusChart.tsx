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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};