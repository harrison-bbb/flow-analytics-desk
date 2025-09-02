import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useChartData, SavingsChartData } from "@/hooks/useChartData";
export const RevenueChart = () => {
  const {
    data,
    loading
  } = useChartData('savings');
  if (loading) {
    return <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Money Saved Over Time</CardTitle>
          <CardDescription>Monthly savings from automated workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">Loading...</div>
        </CardContent>
      </Card>;
  }
  return <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Money Saved Over Time</CardTitle>
        <CardDescription>Monthly savings from automations</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data as SavingsChartData[]}>
            <defs>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="50%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `$${value}`} />
            <Tooltip content={({
            active,
            payload,
            label
          }) => {
            if (active && payload && payload.length) {
              return <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {label}
                          </span>
                          <span className="font-bold text-success">
                            ${payload[0].value?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>;
            }
            return null;
          }} />
            <Area 
              type="monotone" 
              dataKey="savings" 
              stroke="hsl(var(--success))" 
              fill="url(#savingsGradient)" 
              strokeWidth={2} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>;
};