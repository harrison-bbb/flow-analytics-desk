import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isAbsolute?: boolean;
  };
  variant?: "default" | "success" | "warning";
  className?: string;
}

export const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = "default",
  className 
}: MetricCardProps) => {
  const variants = {
    default: "border-border",
    success: "border-success/20 bg-success/5",
    warning: "border-warning/20 bg-warning/5"
  };

  const iconVariants = {
    default: "text-muted-foreground",
    success: "text-success",
    warning: "text-warning"
  };

  return (
    <Card className={cn("relative overflow-hidden", variants[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", iconVariants[variant])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={cn(
              "font-medium",
              trend.value > 0 ? "text-success" : trend.value < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {trend.value > 0 ? "+" : ""}
              {trend.value < 0 ? (
                `${trend.isAbsolute ? 
                  (Math.abs(trend.value) >= 1000 ? 
                    `$${(Math.abs(trend.value) / 1000).toFixed(1)}k` : 
                    `$${Math.abs(trend.value).toLocaleString()}`
                  ) : 
                  `${Math.abs(trend.value)}%`
                } Less than last month`
              ) : (
                trend.isAbsolute ? 
                  (trend.value >= 1000 ? 
                    `$${(trend.value / 1000).toFixed(1)}k` : 
                    `$${Math.round(trend.value).toLocaleString()}`
                  ) : 
                  `${trend.value}%`
              )}
            </span>
            {trend.value >= 0 && (
              <span> {trend.label}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
};