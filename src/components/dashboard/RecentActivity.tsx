import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Receipt, 
  CreditCard,
} from "lucide-react";
import { useRecentActivity } from "@/hooks/useDashboardStats";
import { useCompany } from "@/hooks/useCompany";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const iconMap = {
  invoice: FileText,
  receipt: Receipt,
  expense: CreditCard,
};

const iconColorMap = {
  invoice: "bg-info/10 text-info",
  receipt: "bg-warning/10 text-warning",
  expense: "bg-destructive/10 text-destructive",
};

const statusBadgeVariant: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  paid: "success",
  verified: "success",
  approved: "success",
  pending: "warning",
  sent: "warning",
  rejected: "destructive",
  draft: "muted",
};

export function RecentActivity() {
  const { data: activities, isLoading } = useRecentActivity();
  const { data: company } = useCompany();
  const currency = company?.currency || "INR";

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activityList = activities || [];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Badge variant="muted">Last 24 hours</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activityList.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {activityList.map((activity) => {
              const Icon = iconMap[activity.type];
              const iconColor = iconColorMap[activity.type];
              
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.description}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(activity.amount, currency)}
                      </p>
                      <Badge variant={statusBadgeVariant[activity.status] || "muted"} className="text-xs">
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
