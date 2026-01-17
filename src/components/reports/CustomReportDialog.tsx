import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { generateReportPDF, downloadPDF } from "./ReportGenerator";
import { useInvoices, useInvoiceStats } from "@/hooks/useInvoices";
import { useExpenses, useExpenseStats } from "@/hooks/useExpenses";
import { useEmployees } from "@/hooks/useEmployees";
import { useCompany } from "@/hooks/useCompany";
import { useToast } from "@/hooks/use-toast";

interface CustomReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reportTypes = [
  { value: "income", label: "Income Report" },
  { value: "expense", label: "Expense Report" },
  { value: "profit-loss", label: "Profit & Loss" },
  { value: "payroll", label: "Payroll Report" },
  { value: "tax", label: "Tax Report" },
  { value: "summary", label: "Monthly Summary" },
];

export function CustomReportDialog({
  open,
  onOpenChange,
}: CustomReportDialogProps) {
  const [reportType, setReportType] = useState("summary");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(subMonths(new Date(), 1)));
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { data: company } = useCompany();
  const { data: invoices } = useInvoices();
  const { data: invoiceStats } = useInvoiceStats();
  const { data: expenses } = useExpenses();
  const { data: expenseStats } = useExpenseStats();
  const { data: employees } = useEmployees();

  const generateCustomReportData = () => {
    const period = `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;

    // Filter data by date range
    const startDateStr = format(startDate, "yyyy-MM-dd");
    const endDateStr = format(endDate, "yyyy-MM-dd");
    
    const filteredInvoices = invoices?.filter((inv) => {
      const invDate = inv.issue_date.split("T")[0]; // Get just the date part
      return invDate >= startDateStr && invDate <= endDateStr;
    }) || [];

    const filteredExpenses = expenses?.filter((exp) => {
      const expDate = exp.expense_date.split("T")[0]; // Get just the date part
      return expDate >= startDateStr && expDate <= endDateStr;
    }) || [];

    const paidInvoices = filteredInvoices.filter((inv) => inv.status === "paid");
    const totalIncome = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const pendingIncome = filteredInvoices
      .filter((inv) => inv.status === "sent")
      .reduce((sum, inv) => sum + Number(inv.total), 0);
    const overdueIncome = filteredInvoices
      .filter((inv) => inv.status === "sent" && new Date(inv.due_date) < new Date())
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    const approvedExpenses = filteredExpenses
      .filter((exp) => exp.status === "approved")
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    const pendingExpenses = filteredExpenses
      .filter((exp) => exp.status === "pending")
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    switch (reportType) {
      case "income":
        return {
          title: "Custom Income Report",
          period,
          companyName: company?.name,
          sections: [
            {
              title: "Income Sources",
              items: [
                { label: "Paid Invoices", value: paidInvoices.length },
                { label: "Total Paid Amount", value: totalIncome },
                { label: "Pending Amount", value: pendingIncome },
                { label: "Overdue Amount", value: overdueIncome },
                { label: "Total Invoices", value: filteredInvoices.length },
              ],
            },
          ],
          totals: [
            { label: "Total Revenue", value: totalIncome + pendingIncome + overdueIncome },
            { label: "Collected Revenue", value: totalIncome },
            { label: "Outstanding Revenue", value: pendingIncome + overdueIncome },
          ],
        };

      case "expense":
        return {
          title: "Custom Expense Report",
          period,
          companyName: company?.name,
          sections: [
            {
              title: "Expense Summary",
              items: [
                { label: "Total Expenses", value: filteredExpenses.length },
                { label: "Approved Expenses", value: approvedExpenses },
                { label: "Pending Expenses", value: pendingExpenses },
                { label: "Rejected Expenses", value: filteredExpenses.filter((e) => e.status === "rejected").length },
              ],
            },
          ],
          totals: [
            { label: "Total Expense Amount", value: totalExpenses },
            { label: "Approved Amount", value: approvedExpenses },
            { label: "Pending Amount", value: pendingExpenses },
          ],
        };

      case "profit-loss":
        const profit = totalIncome - approvedExpenses;
        const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
        return {
          title: "Custom Profit & Loss Statement",
          period,
          companyName: company?.name,
          sections: [
            {
              title: "Revenue",
              items: [
                { label: "Total Revenue", value: totalIncome + pendingIncome + overdueIncome },
                { label: "Collected Revenue", value: totalIncome },
                { label: "Outstanding Revenue", value: pendingIncome + overdueIncome },
              ],
            },
            {
              title: "Expenses",
              items: [
                { label: "Total Expenses", value: totalExpenses },
                { label: "Approved Expenses", value: approvedExpenses },
                { label: "Pending Expenses", value: pendingExpenses },
              ],
            },
          ],
          totals: [
            { label: "Net Profit", value: profit },
            { label: "Profit Margin", value: `${profitMargin.toFixed(2)}%` },
          ],
        };

      case "payroll":
        const totalEmployeesCount = employees?.length || 0;
        const activeEmployees = employees?.filter((e) => e.status === "active").length || 0;
        const totalPayroll = employees?.reduce((sum, e) => sum + (Number(e.salary) || 0), 0) || 0;
        const monthlyPayroll = totalPayroll / 12;
        return {
          title: "Custom Payroll Report",
          period,
          companyName: company?.name,
          sections: [
            {
              title: "Employee Summary",
              items: [
                { label: "Total Employees", value: totalEmployeesCount },
                { label: "Active Employees", value: activeEmployees },
                { label: "On Leave", value: employees?.filter((e) => e.status === "on-leave").length || 0 },
                { label: "Terminated", value: employees?.filter((e) => e.status === "terminated").length || 0 },
              ],
            },
          ],
          totals: [
            { label: "Annual Payroll", value: totalPayroll },
            { label: "Monthly Payroll", value: monthlyPayroll },
          ],
        };

      case "tax":
        const taxableIncome = totalIncome - approvedExpenses;
        const estimatedTax = taxableIncome * 0.25;
        return {
          title: "Custom Tax Report",
          period,
          companyName: company?.name,
          sections: [
            {
              title: "Tax Information",
              items: [
                { label: "Taxable Income", value: taxableIncome },
                { label: "Estimated Tax Rate", value: "25%" },
                { label: "Tax ID", value: company?.tax_id || "N/A" },
                { label: "Period", value: period },
              ],
            },
          ],
          totals: [
            { label: "Estimated Tax Liability", value: estimatedTax },
          ],
        };

      case "summary":
      default:
        return {
          title: "Custom Financial Summary",
          period,
          companyName: company?.name,
          sections: [
            {
              title: "Revenue",
              items: [
                { label: "Total Revenue", value: totalIncome + pendingIncome + overdueIncome },
                { label: "Collected", value: totalIncome },
                { label: "Pending", value: pendingIncome },
                { label: "Overdue", value: overdueIncome },
              ],
            },
            {
              title: "Expenses",
              items: [
                { label: "Total Expenses", value: totalExpenses },
                { label: "Approved", value: approvedExpenses },
                { label: "Pending", value: pendingExpenses },
              ],
            },
            {
              title: "Employees",
              items: [
                { label: "Total Employees", value: employees?.length || 0 },
                { label: "Active", value: employees?.filter((e) => e.status === "active").length || 0 },
              ],
            },
          ],
          totals: [
            { label: "Net Profit", value: totalIncome - approvedExpenses },
            { label: "Profit Margin", value: totalIncome > 0 ? `${(((totalIncome - approvedExpenses) / totalIncome) * 100).toFixed(2)}%` : "0%" },
          ],
        };
    }
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Invalid dates",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: "Invalid date range",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const reportData = generateCustomReportData();
      const blob = await generateReportPDF(reportData);
      const filename = `custom-${reportType}-report-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.pdf`;
      downloadPDF(blob, filename);
      
      toast({
        title: "Report generated",
        description: "Custom report has been generated and downloaded",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Report generation failed:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const setPresetPeriod = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case "this-month":
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case "last-month":
        setStartDate(startOfMonth(subMonths(now, 1)));
        setEndDate(endOfMonth(subMonths(now, 1)));
        break;
      case "last-3-months":
        setStartDate(startOfMonth(subMonths(now, 3)));
        setEndDate(endOfMonth(now));
        break;
      case "this-year":
        setStartDate(new Date(now.getFullYear(), 0, 1));
        setEndDate(new Date(now.getFullYear(), 11, 31));
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Report</DialogTitle>
          <DialogDescription>
            Generate a custom financial report with your selected date range and report type
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type */}
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Presets */}
          <div className="space-y-2">
            <Label>Quick Periods</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPresetPeriod("this-month")}
              >
                This Month
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPresetPeriod("last-month")}
              >
                Last Month
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPresetPeriod("last-3-months")}
              >
                Last 3 Months
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPresetPeriod("this-year")}
              >
                This Year
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
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
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
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
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
