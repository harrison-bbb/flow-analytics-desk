import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useChartData, ExecutionChartData } from "@/hooks/useChartData";
export const ExecutionsChart = () => {
  const {
    data,
    loading
  } = useChartData('executions');
  if (loading) {
    return <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle>Daily Executions</CardTitle>
          <CardDescription>Workflow executions this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">Loading...</div>
        </CardContent>
      </Card>;
  }
  return;
};