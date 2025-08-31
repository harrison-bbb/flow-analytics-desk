import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const ActivityFeed = () => {
  const { data, loading, error } = useActivityFeed();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading activity feed: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No recent activity. Your workflow executions will appear here.
          </p>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="mt-0.5">
                  {item.status === 'Success' ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {item.workflow_name}
                    </h4>
                    <Badge 
                      variant={item.status === 'Success' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.details}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </div>
                    {item.status === 'Success' && (
                      <>
                        {item.time_saved > 0 && (
                          <span>🕒 {item.time_saved}h saved</span>
                        )}
                        {item.money_saved > 0 && (
                          <span>💰 ${item.money_saved} saved</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};