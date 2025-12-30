import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";

export type AnomalyType =
  | "high_amount"
  | "duplicate"
  | "rapid_succession"
  | "threshold_gaming"
  | "unusual_category"
  | "weekend_expense"
  | "round_amount";

export interface ExpenseAnomaly {
  id: string;
  expenseId: string;
  type: AnomalyType;
  severity: "low" | "medium" | "high";
  description: string;
  details: string;
  expense: {
    id: string;
    description: string;
    amount: number;
    expense_date: string;
    department: string | null;
    status: string | null;
    created_by: string | null;
    category_name: string | null;
    submitter_name: string | null;
  };
  relatedExpenses?: string[];
}

interface ExpenseWithDetails {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  department: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
  category_id: string | null;
  expense_categories: { name: string } | null;
  profiles: { full_name: string | null } | null;
}

// Configuration for anomaly detection thresholds
const ANOMALY_CONFIG = {
  // Amount is considered high if it exceeds category average by this multiplier
  highAmountMultiplier: 2.5,
  // Minimum amount to flag as high (to avoid flagging small variations)
  minHighAmount: 500,
  // Time window (hours) to detect rapid succession
  rapidSuccessionHours: 2,
  // Number of expenses in rapid succession to flag
  rapidSuccessionCount: 3,
  // Threshold gaming: flag expenses just under these common approval limits
  thresholdLimits: [100, 500, 1000, 2500, 5000],
  // How close to threshold to flag (percentage)
  thresholdProximity: 0.05,
  // Round amounts to flag (divisible by these)
  roundAmountDivisors: [100, 500, 1000],
  // Days to look back for analysis
  analysisWindow: 90,
};

function detectAnomalies(expenses: ExpenseWithDetails[]): ExpenseAnomaly[] {
  const anomalies: ExpenseAnomaly[] = [];
  
  if (!expenses || expenses.length === 0) return anomalies;

  // Calculate category averages
  const categoryStats = new Map<string, { total: number; count: number; amounts: number[] }>();
  expenses.forEach(exp => {
    const catId = exp.category_id || "uncategorized";
    const stats = categoryStats.get(catId) || { total: 0, count: 0, amounts: [] };
    stats.total += Number(exp.amount);
    stats.count++;
    stats.amounts.push(Number(exp.amount));
    categoryStats.set(catId, stats);
  });

  // Group expenses by user
  const userExpenses = new Map<string, ExpenseWithDetails[]>();
  expenses.forEach(exp => {
    if (!exp.created_by) return;
    const existing = userExpenses.get(exp.created_by) || [];
    existing.push(exp);
    userExpenses.set(exp.created_by, existing);
  });

  expenses.forEach((expense) => {
    const amount = Number(expense.amount);
    const expenseData = {
      id: expense.id,
      description: expense.description,
      amount: amount,
      expense_date: expense.expense_date,
      department: expense.department,
      status: expense.status,
      created_by: expense.created_by,
      category_name: expense.expense_categories?.name || null,
      submitter_name: expense.profiles?.full_name || null,
    };

    // 1. High amount anomaly - expense significantly above category average
    const catId = expense.category_id || "uncategorized";
    const catStats = categoryStats.get(catId);
    if (catStats && catStats.count >= 3) {
      const average = catStats.total / catStats.count;
      const stdDev = Math.sqrt(
        catStats.amounts.reduce((sum, amt) => sum + Math.pow(amt - average, 2), 0) / catStats.count
      );
      
      if (amount > average + (stdDev * ANOMALY_CONFIG.highAmountMultiplier) && 
          amount >= ANOMALY_CONFIG.minHighAmount) {
        anomalies.push({
          id: `high-${expense.id}`,
          expenseId: expense.id,
          type: "high_amount",
          severity: amount > average * 5 ? "high" : amount > average * 3 ? "medium" : "low",
          description: "Unusually high amount",
          details: `This expense of $${amount.toLocaleString()} is ${((amount / average - 1) * 100).toFixed(0)}% above the category average of $${average.toFixed(2)}`,
          expense: expenseData,
        });
      }
    }

    // 2. Duplicate detection - same amount, vendor/description on same day
    const duplicates = expenses.filter(e => 
      e.id !== expense.id &&
      Number(e.amount) === amount &&
      e.description.toLowerCase() === expense.description.toLowerCase() &&
      isSameDay(parseISO(e.expense_date), parseISO(expense.expense_date))
    );
    
    if (duplicates.length > 0) {
      anomalies.push({
        id: `duplicate-${expense.id}`,
        expenseId: expense.id,
        type: "duplicate",
        severity: "high",
        description: "Potential duplicate expense",
        details: `Found ${duplicates.length} other expense(s) with the same amount ($${amount}), description, and date`,
        expense: expenseData,
        relatedExpenses: duplicates.map(d => d.id),
      });
    }

    // 3. Rapid succession - multiple expenses in short time window
    if (expense.created_by) {
      const userExps = userExpenses.get(expense.created_by) || [];
      const expTime = new Date(expense.created_at).getTime();
      const nearbyExpenses = userExps.filter(e => {
        const timeDiff = Math.abs(new Date(e.created_at).getTime() - expTime);
        return e.id !== expense.id && timeDiff <= ANOMALY_CONFIG.rapidSuccessionHours * 60 * 60 * 1000;
      });
      
      if (nearbyExpenses.length >= ANOMALY_CONFIG.rapidSuccessionCount - 1) {
        anomalies.push({
          id: `rapid-${expense.id}`,
          expenseId: expense.id,
          type: "rapid_succession",
          severity: "medium",
          description: "Rapid expense submission",
          details: `${nearbyExpenses.length + 1} expenses submitted within ${ANOMALY_CONFIG.rapidSuccessionHours} hours`,
          expense: expenseData,
          relatedExpenses: nearbyExpenses.map(e => e.id),
        });
      }
    }

    // 4. Threshold gaming - amounts just under approval limits
    for (const threshold of ANOMALY_CONFIG.thresholdLimits) {
      const proximityAmount = threshold * ANOMALY_CONFIG.thresholdProximity;
      if (amount >= threshold - proximityAmount && amount < threshold) {
        anomalies.push({
          id: `threshold-${expense.id}-${threshold}`,
          expenseId: expense.id,
          type: "threshold_gaming",
          severity: "medium",
          description: "Amount near approval threshold",
          details: `Amount of $${amount} is just ${(threshold - amount).toFixed(2)} below the $${threshold} threshold`,
          expense: expenseData,
        });
        break;
      }
    }

    // 5. Weekend expense
    const expenseDate = parseISO(expense.expense_date);
    const dayOfWeek = expenseDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      anomalies.push({
        id: `weekend-${expense.id}`,
        expenseId: expense.id,
        type: "weekend_expense",
        severity: "low",
        description: "Weekend expense",
        details: `Expense dated on a ${dayOfWeek === 0 ? "Sunday" : "Saturday"}`,
        expense: expenseData,
      });
    }

    // 6. Suspiciously round amounts (for larger expenses)
    if (amount >= 100) {
      for (const divisor of ANOMALY_CONFIG.roundAmountDivisors) {
        if (amount >= divisor && amount % divisor === 0) {
          anomalies.push({
            id: `round-${expense.id}`,
            expenseId: expense.id,
            type: "round_amount",
            severity: "low",
            description: "Round amount",
            details: `Amount of $${amount} is a round number, which may warrant verification`,
            expense: expenseData,
          });
          break;
        }
      }
    }
  });

  // Deduplicate anomalies (keep highest severity for same expense and type)
  const uniqueAnomalies = new Map<string, ExpenseAnomaly>();
  const severityOrder = { high: 3, medium: 2, low: 1 };
  
  anomalies.forEach(anomaly => {
    const key = `${anomaly.expenseId}-${anomaly.type}`;
    const existing = uniqueAnomalies.get(key);
    if (!existing || severityOrder[anomaly.severity] > severityOrder[existing.severity]) {
      uniqueAnomalies.set(key, anomaly);
    }
  });

  return Array.from(uniqueAnomalies.values())
    .sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
}

export function useExpenseAnomalies() {
  return useQuery({
    queryKey: ["expense-anomalies"],
    queryFn: async () => {
      const cutoffDate = subDays(new Date(), ANOMALY_CONFIG.analysisWindow).toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          id,
          description,
          amount,
          expense_date,
          department,
          status,
          created_by,
          created_at,
          category_id,
          expense_categories (name)
        `)
        .gte("expense_date", cutoffDate)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately to get submitter names
      const creatorIds = [...new Set(data?.map(e => e.created_by).filter(Boolean) || [])];
      const profilesMap = new Map<string, string>();
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", creatorIds);
        
        profiles?.forEach(p => {
          if (p.full_name) profilesMap.set(p.id, p.full_name);
        });
      }

      // Map data with profiles
      const expensesWithProfiles = data?.map(exp => ({
        ...exp,
        profiles: exp.created_by && profilesMap.has(exp.created_by) 
          ? { full_name: profilesMap.get(exp.created_by) || null }
          : null
      })) as ExpenseWithDetails[];

      return detectAnomalies(expensesWithProfiles);
    },
  });
}

export function useAnomalySummary() {
  const { data: anomalies, isLoading } = useExpenseAnomalies();

  const summary = {
    total: anomalies?.length || 0,
    high: anomalies?.filter(a => a.severity === "high").length || 0,
    medium: anomalies?.filter(a => a.severity === "medium").length || 0,
    low: anomalies?.filter(a => a.severity === "low").length || 0,
    byType: {} as Record<AnomalyType, number>,
  };

  if (anomalies) {
    anomalies.forEach(a => {
      summary.byType[a.type] = (summary.byType[a.type] || 0) + 1;
    });
  }

  return { summary, isLoading };
}

export function useSendAnomalyAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (anomalies: ExpenseAnomaly[]) => {
      const highSeverityAnomalies = anomalies.filter(a => a.severity === "high");
      
      if (highSeverityAnomalies.length === 0) {
        throw new Error("No high-severity anomalies to report");
      }

      const { data, error } = await supabase.functions.invoke("send-anomaly-alert", {
        body: { anomalies: highSeverityAnomalies },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Alert sent to ${data.sent} manager${data.sent !== 1 ? "s" : ""}`);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send alert: ${error.message}`);
    },
  });
}
