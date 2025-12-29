import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalReceipts: number;
  receiptsChange: number;
  totalExpenses: number;
  expensesChange: number;
  pendingInvoices: number;
  pendingInvoicesCount: number;
  monthlyProfit: number;
  profitChange: number;
  overdueInvoices: { count: number; total: number };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch receipts for current month
      const { data: currentReceipts } = await supabase
        .from("receipts")
        .select("amount")
        .gte("receipt_date", currentMonthStart.toISOString().split("T")[0]);

      // Fetch receipts for last month
      const { data: lastReceipts } = await supabase
        .from("receipts")
        .select("amount")
        .gte("receipt_date", lastMonthStart.toISOString().split("T")[0])
        .lte("receipt_date", lastMonthEnd.toISOString().split("T")[0]);

      // Fetch expenses for current month
      const { data: currentExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", currentMonthStart.toISOString().split("T")[0]);

      // Fetch expenses for last month
      const { data: lastExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", lastMonthStart.toISOString().split("T")[0])
        .lte("expense_date", lastMonthEnd.toISOString().split("T")[0]);

      // Fetch pending invoices
      const { data: pendingInvoices } = await supabase
        .from("invoices")
        .select("total")
        .in("status", ["pending", "sent"]);

      // Fetch overdue invoices
      const today = now.toISOString().split("T")[0];
      const { data: overdueInvoices } = await supabase
        .from("invoices")
        .select("total")
        .lt("due_date", today)
        .in("status", ["pending", "sent"]);

      // Calculate totals
      const totalReceipts = currentReceipts?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      const lastTotalReceipts = lastReceipts?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      const receiptsChange = lastTotalReceipts > 0 
        ? ((totalReceipts - lastTotalReceipts) / lastTotalReceipts) * 100 
        : 0;

      const totalExpenses = currentExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const lastTotalExpenses = lastExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const expensesChange = lastTotalExpenses > 0 
        ? ((totalExpenses - lastTotalExpenses) / lastTotalExpenses) * 100 
        : 0;

      const pendingTotal = pendingInvoices?.reduce((sum, i) => sum + Number(i.total), 0) || 0;
      const overdueTotal = overdueInvoices?.reduce((sum, i) => sum + Number(i.total), 0) || 0;

      const monthlyProfit = totalReceipts - totalExpenses;
      const lastMonthlyProfit = lastTotalReceipts - lastTotalExpenses;
      const profitChange = lastMonthlyProfit > 0 
        ? ((monthlyProfit - lastMonthlyProfit) / lastMonthlyProfit) * 100 
        : 0;

      return {
        totalReceipts,
        receiptsChange,
        totalExpenses,
        expensesChange,
        pendingInvoices: pendingTotal,
        pendingInvoicesCount: pendingInvoices?.length || 0,
        monthlyProfit,
        profitChange,
        overdueInvoices: {
          count: overdueInvoices?.length || 0,
          total: overdueTotal,
        },
      };
    },
  });
}

export interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
}

export function useCashFlowData() {
  return useQuery({
    queryKey: ["cash-flow-data"],
    queryFn: async (): Promise<CashFlowData[]> => {
      const now = new Date();
      const months: CashFlowData[] = [];

      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthStart.toLocaleDateString("en-US", { month: "short" });

        const { data: receipts } = await supabase
          .from("receipts")
          .select("amount")
          .gte("receipt_date", monthStart.toISOString().split("T")[0])
          .lte("receipt_date", monthEnd.toISOString().split("T")[0]);

        const { data: expenses } = await supabase
          .from("expenses")
          .select("amount")
          .gte("expense_date", monthStart.toISOString().split("T")[0])
          .lte("expense_date", monthEnd.toISOString().split("T")[0]);

        months.push({
          month: monthName,
          income: receipts?.reduce((sum, r) => sum + Number(r.amount), 0) || 0,
          expenses: expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
        });
      }

      return months;
    },
  });
}

export interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

const CATEGORY_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function useExpenseBreakdown() {
  return useQuery({
    queryKey: ["expense-breakdown"],
    queryFn: async (): Promise<ExpenseCategory[]> => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount, category_id, expense_categories(name)")
        .gte("expense_date", monthStart.toISOString().split("T")[0]);

      // Group by category
      const categoryMap = new Map<string, number>();
      expenses?.forEach((expense) => {
        const categoryName = (expense.expense_categories as any)?.name || "Uncategorized";
        const current = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, current + Number(expense.amount));
      });

      // Convert to array with colors
      const categories: ExpenseCategory[] = [];
      let colorIndex = 0;
      categoryMap.forEach((value, name) => {
        categories.push({
          name,
          value,
          color: CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length],
        });
        colorIndex++;
      });

      return categories.sort((a, b) => b.value - a.value).slice(0, 5);
    },
  });
}

export interface RecentActivityItem {
  id: string;
  type: "receipt" | "expense" | "invoice";
  description: string;
  amount: number;
  date: string;
  status: string;
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: async (): Promise<RecentActivityItem[]> => {
      // Fetch recent receipts
      const { data: receipts } = await supabase
        .from("receipts")
        .select("id, vendor, amount, created_at, status")
        .order("created_at", { ascending: false })
        .limit(3);

      // Fetch recent expenses
      const { data: expenses } = await supabase
        .from("expenses")
        .select("id, description, amount, created_at, status")
        .order("created_at", { ascending: false })
        .limit(3);

      // Fetch recent invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, client_name, total, created_at, status")
        .order("created_at", { ascending: false })
        .limit(3);

      const activities: RecentActivityItem[] = [];

      receipts?.forEach((r) => {
        activities.push({
          id: r.id,
          type: "receipt",
          description: `Receipt from ${r.vendor}`,
          amount: Number(r.amount),
          date: r.created_at,
          status: r.status || "pending",
        });
      });

      expenses?.forEach((e) => {
        activities.push({
          id: e.id,
          type: "expense",
          description: e.description,
          amount: Number(e.amount),
          date: e.created_at,
          status: e.status || "pending",
        });
      });

      invoices?.forEach((i) => {
        activities.push({
          id: i.id,
          type: "invoice",
          description: `Invoice for ${i.client_name}`,
          amount: Number(i.total),
          date: i.created_at,
          status: i.status || "draft",
        });
      });

      // Sort by date and take top 8
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);
    },
  });
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  client: string;
  amount: number;
  status: string;
  dueDate: string;
}

export function useRecentInvoices() {
  return useQuery({
    queryKey: ["recent-invoices"],
    queryFn: async (): Promise<InvoiceItem[]> => {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, client_name, total, status, due_date")
        .order("created_at", { ascending: false })
        .limit(5);

      return (
        invoices?.map((i) => ({
          id: i.id,
          invoiceNumber: i.invoice_number,
          client: i.client_name,
          amount: Number(i.total),
          status: i.status || "draft",
          dueDate: i.due_date,
        })) || []
      );
    },
  });
}
