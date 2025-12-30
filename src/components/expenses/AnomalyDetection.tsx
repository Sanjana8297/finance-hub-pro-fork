import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  TrendingUp,
  Copy,
  Clock,
  Target,
  Calendar,
  CircleDollarSign,
  Shield,
  Eye,
  ChevronDown,
  ChevronUp,
  Bell,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useExpenseAnomalies, useAnomalySummary, useSendAnomalyAlert, AnomalyType, ExpenseAnomaly } from "@/hooks/useExpenseAnomalies";

const anomalyTypeConfig: Record<AnomalyType, { label: string; icon: typeof AlertTriangle; color: string }> = {
  high_amount: { label: "High Amount", icon: TrendingUp, color: "text-orange-500" },
  duplicate: { label: "Duplicate", icon: Copy, color: "text-red-500" },
  rapid_succession: { label: "Rapid Submission", icon: Clock, color: "text-yellow-500" },
  threshold_gaming: { label: "Near Threshold", icon: Target, color: "text-purple-500" },
  unusual_category: { label: "Unusual Category", icon: AlertTriangle, color: "text-blue-500" },
  weekend_expense: { label: "Weekend", icon: Calendar, color: "text-gray-500" },
  round_amount: { label: "Round Amount", icon: CircleDollarSign, color: "text-teal-500" },
};

const severityConfig = {
  high: { label: "High", variant: "destructive" as const, bgColor: "bg-destructive/10" },
  medium: { label: "Medium", variant: "warning" as const, bgColor: "bg-warning/10" },
  low: { label: "Low", variant: "muted" as const, bgColor: "bg-muted" },
};

function AnomalyCard({ anomaly }: { anomaly: ExpenseAnomaly }) {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = anomalyTypeConfig[anomaly.type];
  const sevConfig = severityConfig[anomaly.severity];
  const Icon = typeConfig.icon;

  return (
    <Card className={`${sevConfig.bgColor} border-l-4 ${
      anomaly.severity === "high" ? "border-l-destructive" : 
      anomaly.severity === "medium" ? "border-l-warning" : "border-l-muted-foreground"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${typeConfig.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{anomaly.description}</span>
                <Badge variant={sevConfig.variant} className="text-xs">
                  {sevConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{anomaly.details}</p>
              
              {expanded && (
                <div className="mt-3 rounded-md bg-background/50 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Expense: </span>
                      <span className="font-medium">{anomaly.expense.description}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Amount: </span>
                      <span className="font-medium">${anomaly.expense.amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date: </span>
                      <span>{format(new Date(anomaly.expense.expense_date), "MMM d, yyyy")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted by: </span>
                      <span>{anomaly.expense.submitter_name || "Unknown"}</span>
                    </div>
                    {anomaly.expense.category_name && (
                      <div>
                        <span className="text-muted-foreground">Category: </span>
                        <span>{anomaly.expense.category_name}</span>
                      </div>
                    )}
                    {anomaly.expense.department && (
                      <div>
                        <span className="text-muted-foreground">Department: </span>
                        <span>{anomaly.expense.department}</span>
                      </div>
                    )}
                  </div>
                  {anomaly.relatedExpenses && anomaly.relatedExpenses.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Related expenses: </span>
                      <span>{anomaly.relatedExpenses.length} linked</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnomalyDetection() {
  const { data: anomalies, isLoading } = useExpenseAnomalies();
  const { summary } = useAnomalySummary();
  const sendAlert = useSendAnomalyAlert();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredAnomalies = anomalies?.filter(a => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    return true;
  });

  const handleSendAlert = () => {
    if (anomalies) {
      sendAlert.mutate(anomalies);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Button for High Severity */}
      {summary.high > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                {summary.high} high-severity anomal{summary.high > 1 ? "ies" : "y"} detected
              </p>
              <p className="text-sm text-muted-foreground">
                Alert managers immediately to review flagged expenses
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSendAlert} 
            disabled={sendAlert.isPending}
            variant="destructive"
          >
            {sendAlert.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bell className="mr-2 h-4 w-4" />
            )}
            Send Alert to Managers
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Anomalies</p>
              <p className="text-2xl font-bold">{summary.total}</p>
            </div>
          </div>
        </Card>
        
        <Card variant="stat" className="p-4 border-l-4 border-l-destructive">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Severity</p>
              <p className="text-2xl font-bold text-destructive">{summary.high}</p>
            </div>
          </div>
        </Card>
        
        <Card variant="stat" className="p-4 border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-warning/10 p-2">
              <Eye className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Medium Severity</p>
              <p className="text-2xl font-bold text-warning">{summary.medium}</p>
            </div>
          </div>
        </Card>
        
        <Card variant="stat" className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Severity</p>
              <p className="text-2xl font-bold">{summary.low}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Anomaly Type Breakdown */}
      {Object.keys(summary.byType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anomaly Types</CardTitle>
            <CardDescription>Breakdown by detection type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(summary.byType).map(([type, count]) => {
                const config = anomalyTypeConfig[type as AnomalyType];
                const Icon = config.icon;
                return (
                  <TooltipProvider key={type}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span className="text-sm font-medium">{config.label}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{count} {config.label.toLowerCase()} anomalies detected</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Detected Anomalies</CardTitle>
              <CardDescription>Review flagged expenses for unusual patterns</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(anomalyTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredAnomalies || filteredAnomalies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-success" />
              <p className="mt-4 text-lg font-medium">No anomalies detected</p>
              <p className="text-sm text-muted-foreground">
                All expenses appear to follow normal patterns
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnomalies.map((anomaly) => (
                <AnomalyCard key={anomaly.id} anomaly={anomaly} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
