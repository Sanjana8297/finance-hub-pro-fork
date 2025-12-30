import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowUpCircle, 
  Eye, 
  Loader2,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { useAnomalyReviews, useReviewAnomaly, useBulkReviewAnomalies, useAnomalyReviewStats, AnomalyReview } from "@/hooks/useAnomalyReviews";

const severityColors: Record<string, string> = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

const statusIcons: Record<string, React.ElementType> = {
  pending: AlertTriangle,
  reviewed: CheckCircle2,
  dismissed: XCircle,
  escalated: ArrowUpCircle,
};

const anomalyTypeLabels: Record<string, string> = {
  high_amount: "High Amount",
  duplicate: "Duplicate",
  rapid_succession: "Rapid Succession",
  near_threshold: "Near Threshold",
  weekend_expense: "Weekend Expense",
  round_amount: "Round Amount",
};

export function AnomalyReviewManager() {
  const { data: reviews, isLoading } = useAnomalyReviews();
  const { data: stats } = useAnomalyReviewStats();
  const reviewAnomaly = useReviewAnomaly();
  const bulkReview = useBulkReviewAnomalies();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<AnomalyReview | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const filteredReviews = reviews?.filter((r) => {
    if (activeTab === "pending") return r.status === "pending";
    if (activeTab === "reviewed") return r.status === "reviewed";
    if (activeTab === "dismissed") return r.status === "dismissed";
    if (activeTab === "escalated") return r.status === "escalated";
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredReviews?.map((r) => r.id) || []);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const openReviewDialog = (review: AnomalyReview) => {
    setCurrentReview(review);
    setResolutionNotes("");
    setReviewDialogOpen(true);
  };

  const handleReview = async (status: "reviewed" | "dismissed" | "escalated") => {
    if (!currentReview) return;
    await reviewAnomaly.mutateAsync({
      id: currentReview.id,
      status,
      resolution_notes: resolutionNotes,
    });
    setReviewDialogOpen(false);
    setCurrentReview(null);
  };

  const handleBulkAction = async (status: "reviewed" | "dismissed") => {
    if (selectedIds.length === 0) return;
    await bulkReview.mutateAsync({ ids: selectedIds, status });
    setSelectedIds([]);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Anomaly Reviews
            </CardTitle>
            <CardDescription>Review and resolve detected expense anomalies</CardDescription>
          </div>
          {stats && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">{stats.highSeverity}</p>
                <p className="text-muted-foreground">High Priority</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-muted-foreground">Pending</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pending ({stats?.pending || 0})
              </TabsTrigger>
              <TabsTrigger value="reviewed" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Reviewed ({stats?.reviewed || 0})
              </TabsTrigger>
              <TabsTrigger value="dismissed" className="gap-2">
                <XCircle className="h-4 w-4" />
                Dismissed ({stats?.dismissed || 0})
              </TabsTrigger>
              <TabsTrigger value="escalated" className="gap-2">
                <ArrowUpCircle className="h-4 w-4" />
                Escalated ({stats?.escalated || 0})
              </TabsTrigger>
            </TabsList>

            {selectedIds.length > 0 && activeTab === "pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("reviewed")}
                  disabled={bulkReview.isPending}
                >
                  {bulkReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mark as Reviewed ({selectedIds.length})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleBulkAction("dismissed")}
                  disabled={bulkReview.isPending}
                >
                  Dismiss ({selectedIds.length})
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredReviews?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No anomalies in this category</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab === "pending" && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredReviews.length && filteredReviews.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Expense</TableHead>
                  <TableHead>Anomaly Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => {
                  const StatusIcon = statusIcons[review.status] || AlertTriangle;
                  return (
                    <TableRow key={review.id}>
                      {activeTab === "pending" && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(review.id)}
                            onCheckedChange={(checked) => handleSelect(review.id, !!checked)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <p className="font-medium">{review.expenses?.description || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatAmount(review.expenses?.amount || 0)} • {review.expenses?.department || "N/A"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {anomalyTypeLabels[review.anomaly_type] || review.anomaly_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={severityColors[review.severity]}>
                          {review.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <StatusIcon className="h-4 w-4" />
                          <span className="capitalize">{review.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openReviewDialog(review)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Tabs>
      </CardContent>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Anomaly</DialogTitle>
            <DialogDescription>
              {currentReview?.expenses?.description} - {anomalyTypeLabels[currentReview?.anomaly_type || ""] || currentReview?.anomaly_type}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-medium">{formatAmount(currentReview?.expenses?.amount || 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Severity</p>
                <Badge className={severityColors[currentReview?.severity || "low"]}>
                  {currentReview?.severity}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {currentReview?.expenses?.expense_date
                    ? format(new Date(currentReview.expenses.expense_date), "MMM d, yyyy")
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Department</p>
                <p className="font-medium">{currentReview?.expenses?.department || "N/A"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Resolution Notes</Label>
              <Textarea
                id="notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Add notes about this anomaly..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleReview("dismissed")}
              disabled={reviewAnomaly.isPending}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Dismiss
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleReview("escalated")}
              disabled={reviewAnomaly.isPending}
              className="gap-2"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Escalate
            </Button>
            <Button
              onClick={() => handleReview("reviewed")}
              disabled={reviewAnomaly.isPending}
              className="gap-2"
            >
              {reviewAnomaly.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle2 className="h-4 w-4" />
              Mark Reviewed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
