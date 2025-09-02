import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkflowPerformance } from "@/hooks/useWorkflowPerformance";
import { TrendingUp, Clock, DollarSign, Target } from "lucide-react";

export const WorkflowPerformanceTable = () => {
  const { data, loading, error, updateWorkflowManaged, updateWorkflowParent } = useWorkflowPerformance();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Workflow Performance This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
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
            <Target className="h-5 w-5" />
            Workflow Performance This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading workflow performance: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const formatSuccessRate = (rate: number) => {
    if (rate >= 95) return { color: "success", text: `${rate}%` };
    if (rate >= 80) return { color: "warning", text: `${rate}%` };
    return { color: "destructive", text: `${rate}%` };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Workflow Performance This Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No workflows found. Start by creating your first automated workflow.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow Name</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Executions
                  </div>
                </TableHead>
                <TableHead className="text-center">Success Rate</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    Time Saved
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Money Saved
                  </div>
                </TableHead>
                <TableHead className="text-center">Sub Workflows</TableHead>
                <TableHead className="text-center">Currently Managed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((workflow) => {
                const successRate = formatSuccessRate(workflow.success_rate);
                const availableParents = data.filter(w => w.id !== workflow.id && !w.parent_workflow_id);
                
                return (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">
                      {workflow.workflow_name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {workflow.total_executions}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={
                          successRate.color === "success" ? "default" : 
                          successRate.color === "warning" ? "secondary" : 
                          "destructive"
                        }
                      >
                        {successRate.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {workflow.time_saved}h
                    </TableCell>
                    <TableCell className="text-center">
                      ${workflow.money_saved}
                    </TableCell>
                    <TableCell className="text-center">
                      <Select
                        value={workflow.parent_workflow_id || "none"}
                        onValueChange={(value) => 
                          updateWorkflowParent(workflow.id, value === "none" ? null : value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border">
                          <SelectItem value="none">None</SelectItem>
                          {availableParents.map((parent) => (
                            <SelectItem key={parent.id} value={parent.id}>
                              {parent.workflow_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={workflow.is_currently_managed}
                        onCheckedChange={(checked) => 
                          updateWorkflowManaged(workflow.id, checked as boolean)
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};