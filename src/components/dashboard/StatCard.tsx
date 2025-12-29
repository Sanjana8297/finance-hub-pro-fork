import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
  className,
}: StatCardProps) {
  const changeColors = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <Card variant="stat" className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {change && (
            <p className={cn("text-sm font-medium", changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
