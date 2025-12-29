import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreateDelegation } from "@/hooks/useExpenseDelegations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DelegationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function DelegationDialog({ open, onOpenChange }: DelegationDialogProps) {
  const [delegateId, setDelegateId] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const createDelegation = useCreateDelegation();

  // Fetch eligible users (those with finance access)
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Get users with finance-related roles
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["super_admin", "admin", "finance_manager", "accountant"]);

        if (roleData && roleData.length > 0) {
          const userIds = roleData.map(r => r.user_id).filter(id => id !== user?.id);
          
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

          setUsers(profiles || []);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      setLoading(false);
    };

    if (open) {
      fetchUsers();
    }
  }, [open, user?.id]);

  const handleSubmit = async () => {
    if (!delegateId || !startDate || !endDate) return;

    await createDelegation.mutateAsync({
      delegate_id: delegateId,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      reason: reason || undefined,
    });

    // Reset form
    setDelegateId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setReason("");
    onOpenChange(false);
  };

  const isValid = delegateId && startDate && endDate && endDate >= startDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Delegate Approval Authority</DialogTitle>
          <DialogDescription className="text-center">
            Delegate your expense approval authority to another team member while you're away.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="delegate">Delegate To <span className="text-destructive">*</span></Label>
            <Select value={delegateId} onValueChange={setDelegateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="" disabled>Loading...</SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value="" disabled>No eligible users found</SelectItem>
                ) : (
                  users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email || "Unknown User"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Annual leave, Business trip, Medical leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createDelegation.isPending}
          >
            {createDelegation.isPending ? "Creating..." : "Create Delegation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
