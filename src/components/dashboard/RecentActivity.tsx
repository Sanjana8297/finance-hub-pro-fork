import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  Receipt, 
  UserPlus,
  CheckCircle2 
} from "lucide-react";

interface Activity {
  id: string;
  type: "invoice" | "receipt" | "user" | "approval";
  title: string;
  description: string;
  time: string;
  status?: "success" | "warning" | "info";
}

const activities: Activity[] = [
  {
    id: "1",
    type: "invoice",
    title: "Invoice #INV-2024-001 created",
    description: "New invoice for Acme Corp - $12,500.00",
    time: "2 minutes ago",
    status: "info",
  },
  {
    id: "2",
    type: "receipt",
    title: "Receipt verified",
    description: "Office supplies - $234.50",
    time: "15 minutes ago",
    status: "success",
  },
  {
    id: "3",
    type: "approval",
    title: "Expense approved",
    description: "Travel expenses by Sarah Johnson",
    time: "1 hour ago",
    status: "success",
  },
  {
    id: "4",
    type: "user",
    title: "New employee added",
    description: "Michael Chen - Engineering",
    time: "3 hours ago",
    status: "info",
  },
  {
    id: "5",
    type: "invoice",
    title: "Invoice #INV-2024-098 paid",
    description: "Payment received from TechStart Inc",
    time: "5 hours ago",
    status: "success",
  },
];

const iconMap = {
  invoice: FileText,
  receipt: Receipt,
  user: UserPlus,
  approval: CheckCircle2,
};

const iconColorMap = {
  invoice: "bg-info/10 text-info",
  receipt: "bg-warning/10 text-warning",
  user: "bg-primary/10 text-primary",
  approval: "bg-success/10 text-success",
};

export function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Badge variant="muted">Last 24 hours</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
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
                  <p className="text-sm font-medium leading-none">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
