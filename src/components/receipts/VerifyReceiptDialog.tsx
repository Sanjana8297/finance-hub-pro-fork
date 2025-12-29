import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useVerifyReceipt, Receipt } from "@/hooks/useReceipts";
import { format } from "date-fns";

interface VerifyReceiptDialogProps {
  receipt: Receipt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerifyReceiptDialog({
  receipt,
  open,
  onOpenChange,
}: VerifyReceiptDialogProps) {
  const [notes, setNotes] = useState("");
  const verifyReceipt = useVerifyReceipt();

  const handleVerify = async (status: "verified" | "rejected") => {
    if (!receipt) return;
    
    await verifyReceipt.mutateAsync({
      id: receipt.id,
      status,
      notes: notes.trim() || undefined,
    });
    
    setNotes("");
    onOpenChange(false);
  };

  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Receipt</DialogTitle>
          <DialogDescription>
            Review and approve or reject this receipt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Summary */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Receipt #</span>
              <span className="text-sm font-medium">{receipt.receipt_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vendor</span>
              <span className="text-sm font-medium">{receipt.vendor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-bold">
                ${Number(receipt.amount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm">
                {format(new Date(receipt.receipt_date), "MMM d, yyyy")}
              </span>
            </div>
            {receipt.category && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm">{receipt.category}</span>
              </div>
            )}
            {receipt.file_url && (
              <div className="pt-2">
                <a
                  href={receipt.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View attached file →
                </a>
              </div>
            )}
          </div>

          {/* Verification Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Verification Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this verification..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="destructive"
            onClick={() => handleVerify("rejected")}
            disabled={verifyReceipt.isPending}
            className="flex-1 sm:flex-none"
          >
            {verifyReceipt.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Reject
          </Button>
          <Button
            onClick={() => handleVerify("verified")}
            disabled={verifyReceipt.isPending}
            className="flex-1 sm:flex-none"
          >
            {verifyReceipt.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
