import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowDown, Loader2 } from "lucide-react";
import { useCreateApprovalChain, useUpdateApprovalChain, ApprovalChainWithLevels } from "@/hooks/useApprovalChains";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roles: { value: AppRole; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "accountant", label: "Accountant" },
  { value: "finance_manager", label: "Finance Manager" },
  { value: "hr", label: "HR" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
  { value: "auditor", label: "Auditor" },
];

interface ApprovalChainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chain?: ApprovalChainWithLevels | null;
}

interface LevelInput {
  role: AppRole;
  required_approvers: number;
}

export function ApprovalChainDialog({ open, onOpenChange, chain }: ApprovalChainDialogProps) {
  const createChain = useCreateApprovalChain();
  const updateChain = useUpdateApprovalChain();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minAmount, setMinAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [levels, setLevels] = useState<LevelInput[]>([{ role: "accountant", required_approvers: 1 }]);

  useEffect(() => {
    if (chain) {
      setName(chain.name);
      setDescription(chain.description || "");
      setMinAmount(chain.min_amount.toString());
      setMaxAmount(chain.max_amount?.toString() || "");
      setIsActive(chain.is_active);
      setLevels(
        chain.levels.length > 0
          ? chain.levels.map((l) => ({ role: l.role, required_approvers: l.required_approvers }))
          : [{ role: "accountant", required_approvers: 1 }]
      );
    } else {
      setName("");
      setDescription("");
      setMinAmount("0");
      setMaxAmount("");
      setIsActive(true);
      setLevels([{ role: "accountant", required_approvers: 1 }]);
    }
  }, [chain, open]);

  const addLevel = () => {
    setLevels([...levels, { role: "finance_manager", required_approvers: 1 }]);
  };

  const removeLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
  };

  const updateLevel = (index: number, field: keyof LevelInput, value: any) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLevels(newLevels);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      description: description || undefined,
      min_amount: parseFloat(minAmount) || 0,
      max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
      levels,
    };

    if (chain) {
      await updateChain.mutateAsync({ id: chain.id, ...data, is_active: isActive });
    } else {
      await createChain.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isSubmitting = createChain.isPending || updateChain.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{chain ? "Edit Approval Chain" : "Create Approval Chain"}</DialogTitle>
          <DialogDescription>
            Configure the approval workflow for expenses within a specific amount range
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Chain Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Value Expenses"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when this approval chain applies"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Amount ($) *</Label>
              <Input
                id="minAmount"
                type="number"
                min="0"
                step="0.01"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amount ($)</Label>
              <Input
                id="maxAmount"
                type="number"
                min="0"
                step="0.01"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="No limit"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Approval Levels</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLevel}>
                <Plus className="h-4 w-4 mr-1" />
                Add Level
              </Button>
            </div>

            <div className="space-y-3">
              {levels.map((level, index) => (
                <div key={index} className="relative">
                  {index > 0 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                    <Badge variant="outline" className="shrink-0">
                      Level {index + 1}
                    </Badge>
                    <Select
                      value={level.role}
                      onValueChange={(value: AppRole) => updateLevel(index, "role", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={level.required_approvers}
                      onChange={(e) => updateLevel(index, "required_approvers", parseInt(e.target.value) || 1)}
                      className="w-20"
                      title="Required approvers"
                    />
                    {levels.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLevel(index)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {chain && (
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {chain ? "Update" : "Create"} Chain
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
