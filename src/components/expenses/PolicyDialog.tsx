import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useExpenseCategories } from "@/hooks/useExpenses";
import {
  useCreateExpensePolicy,
  useUpdateExpensePolicy,
  ExpensePolicy,
  ExpensePolicyInsert,
} from "@/hooks/useExpensePolicies";

interface PolicyDialogProps {
  policy?: ExpensePolicy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const policyTypes = [
  { value: "threshold", label: "Amount Threshold", description: "Flag expenses above a certain amount" },
  { value: "category_restriction", label: "Category Restriction", description: "Flag expenses in specific categories" },
  { value: "daily_limit", label: "Daily Limit", description: "Flag when daily spending exceeds limit" },
  { value: "monthly_limit", label: "Monthly Limit", description: "Flag when monthly spending exceeds limit" },
];

const actionTypes = [
  { value: "flag", label: "Flag for Review", description: "Mark expense for manual review" },
  { value: "require_approval", label: "Require Approval", description: "Expense requires explicit approval" },
  { value: "auto_reject", label: "Auto Reject", description: "Automatically reject expense" },
];

export function PolicyDialog({ policy, open, onOpenChange }: PolicyDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [policyType, setPolicyType] = useState<ExpensePolicyInsert["policy_type"]>("threshold");
  const [thresholdAmount, setThresholdAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [action, setAction] = useState<ExpensePolicyInsert["action"]>("flag");
  const [isActive, setIsActive] = useState(true);

  const { data: categories } = useExpenseCategories();
  const createPolicy = useCreateExpensePolicy();
  const updatePolicy = useUpdateExpensePolicy();

  useEffect(() => {
    if (policy) {
      setName(policy.name);
      setDescription(policy.description || "");
      setPolicyType(policy.policy_type);
      setThresholdAmount(policy.threshold_amount?.toString() || "");
      setCategoryId(policy.category_id || "");
      setAction(policy.action);
      setIsActive(policy.is_active);
    } else {
      setName("");
      setDescription("");
      setPolicyType("threshold");
      setThresholdAmount("");
      setCategoryId("");
      setAction("flag");
      setIsActive(true);
    }
  }, [policy, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const policyData: ExpensePolicyInsert = {
      name,
      description: description || null,
      policy_type: policyType,
      threshold_amount: thresholdAmount ? parseFloat(thresholdAmount) : null,
      category_id: categoryId || null,
      action,
      is_active: isActive,
    };

    if (policy) {
      await updatePolicy.mutateAsync({ id: policy.id, policy: policyData });
    } else {
      await createPolicy.mutateAsync(policyData);
    }

    onOpenChange(false);
  };

  const isLoading = createPolicy.isPending || updatePolicy.isPending;
  const showThreshold = ["threshold", "daily_limit", "monthly_limit"].includes(policyType);
  const showCategory = policyType === "category_restriction";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {policy ? "Edit Policy" : "Create Expense Policy"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Policy Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Value Expense Review"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this policy does..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="policyType">Policy Type</Label>
            <Select value={policyType} onValueChange={(v) => setPolicyType(v as ExpensePolicyInsert["policy_type"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {policyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showThreshold && (
            <div className="space-y-2">
              <Label htmlFor="threshold">
                {policyType === "threshold" ? "Threshold Amount" : 
                 policyType === "daily_limit" ? "Daily Limit" : "Monthly Limit"} ($)
              </Label>
              <Input
                id="threshold"
                type="number"
                step="0.01"
                min="0"
                value={thresholdAmount}
                onChange={(e) => setThresholdAmount(e.target.value)}
                placeholder="Enter amount"
                required={showThreshold}
              />
            </div>
          )}

          {showCategory && (
            <div className="space-y-2">
              <Label htmlFor="category">Restricted Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="action">Action When Triggered</Label>
            <Select value={action} onValueChange={(v) => setAction(v as ExpensePolicyInsert["action"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Active</Label>
              <p className="text-xs text-muted-foreground">
                Only active policies will be checked against new expenses
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Saving..." : policy ? "Update Policy" : "Create Policy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
