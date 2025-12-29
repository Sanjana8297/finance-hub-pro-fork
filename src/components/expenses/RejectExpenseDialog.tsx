import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle } from "lucide-react";

interface RejectExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseDescription: string;
  expenseAmount: number;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function RejectExpenseDialog({
  open,
  onOpenChange,
  expenseDescription,
  expenseAmount,
  onConfirm,
  isLoading,
}: RejectExpenseDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("Please provide a reason for rejection");
      return;
    }
    if (trimmedReason.length < 10) {
      setError("Reason must be at least 10 characters");
      return;
    }
    if (trimmedReason.length > 500) {
      setError("Reason must be less than 500 characters");
      return;
    }
    setError("");
    onConfirm(trimmedReason);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason("");
      setError("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">Reject Expense</DialogTitle>
          <DialogDescription className="text-center">
            You are about to reject the following expense. Please provide a reason.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-lg bg-muted p-4">
          <p className="font-medium">{expenseDescription}</p>
          <p className="text-lg font-bold text-foreground">
            ${expenseAmount.toLocaleString()}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rejection-reason">
            Reason for Rejection <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="rejection-reason"
            placeholder="Please explain why this expense is being rejected..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            className={error ? "border-destructive" : ""}
            rows={4}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            {reason.length}/500 characters
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Rejecting..." : "Reject Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
