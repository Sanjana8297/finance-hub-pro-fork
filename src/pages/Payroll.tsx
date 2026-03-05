import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  Printer,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react";
import { PayslipDialog } from "@/components/payroll/PayslipDialog";
import { generatePayslipPDF, downloadPDF } from "@/components/payroll/PayslipPDF";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/hooks/useCompany";
import { usePayslips, usePayslipStats } from "@/hooks/usePayslips";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface PayslipDisplay {
  id: string;
  employeeId: string;
  employee: {
    name: string;
    position: string;
    email?: string;
    avatar: string;
  };
  period: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "paid" | "pending" | "processing";
  payDate: string;
}

const statusConfig = {
  paid: {
    variant: "success" as const,
    icon: CheckCircle,
    label: "Paid",
  },
  pending: {
    variant: "warning" as const,
    icon: Clock,
    label: "Pending",
  },
  processing: {
    variant: "info" as const,
    icon: Clock,
    label: "Processing",
  },
};

const Payroll = () => {
  const navigate = useNavigate();
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipDisplay | null>(null);
  const [isPayslipDialogOpen, setIsPayslipDialogOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const { data: company } = useCompany();
  const { data: payslipsData, isLoading } = usePayslips();
  const { data: stats } = usePayslipStats();
  const currency = company?.currency || "INR";

  // Transform database payslips to display format
  const payslips: PayslipDisplay[] = (payslipsData || []).map((payslip) => {
    const employee = payslip.employees;
    const periodStart = new Date(payslip.period_start);
    const periodEnd = new Date(payslip.period_end);
    const period = format(periodStart, "MMMM yyyy");
    
    return {
      id: payslip.id,
      employeeId: payslip.employee_id,
      employee: {
        name: employee?.full_name || "Unknown Employee",
        position: employee?.position || "N/A",
        email: employee?.email || undefined,
        avatar: employee?.email || employee?.full_name || "employee",
      },
      period,
      basicSalary: Number(payslip.basic_salary),
      allowances: Number(payslip.allowances || 0),
      deductions: Number(payslip.deductions || 0),
      netPay: Number(payslip.net_pay),
      status: (payslip.status as "paid" | "pending" | "processing") || "pending",
      payDate: payslip.pay_date ? format(new Date(payslip.pay_date), "MMM d, yyyy") : "N/A",
    };
  });

  // Filter payslips based on search query and status filter
  const filteredPayslips = payslips.filter((payslip) => {
    const matchesSearch =
      !searchQuery ||
      payslip.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payslip.employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payslip.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payslip.status.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || payslip.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPayroll = stats?.totalPayroll || 0;
  const paidAmount = stats?.paidAmount || 0;
  const pendingAmount = stats?.pendingAmount || 0;

  // Get current period for display (most recent payslip period or current month)
  const currentPeriod = payslips.length > 0 
    ? payslips[0].period 
    : format(new Date(), "MMMM yyyy");

  const handleViewPayslip = (payslip: PayslipDisplay) => {
    setSelectedPayslip(payslip);
    setIsPayslipDialogOpen(true);
  };

  const handleOpenEmployeePayroll = (employeeId: string) => {
    if (!employeeId) {
      toast({
        title: "Employee details unavailable",
        description: "Could not open payroll details for this employee.",
        variant: "destructive",
      });
      return;
    }

    const detailsUrl = `/payroll/employee/${encodeURIComponent(employeeId)}`;
    navigate(detailsUrl);
  };

  const handleDownloadPDF = async (payslip: PayslipDisplay) => {
    try {
      setDownloadingId(payslip.id);
      
      const blob = await generatePayslipPDF(
        payslip,
        company?.name || undefined,
        company?.address || undefined
      );
      
      const filename = `payslip-${payslip.employee.name.replace(/\s+/g, "-")}-${payslip.period.replace(/\s+/g, "-")}.pdf`;
      downloadPDF(blob, filename);
      
      toast({
        title: "PDF downloaded",
        description: `Payslip for ${payslip.employee.name} has been downloaded`,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({
        title: "Download failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = async (payslip: PayslipDisplay) => {
    try {
      setPrintingId(payslip.id);
      
      const blob = await generatePayslipPDF(
        payslip,
        company?.name || undefined,
        company?.address || undefined
      );
      
      // Create object URL and open in new window for printing
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      
      if (printWindow) {
        // Wait for PDF to load, then trigger print dialog
        // PDFs in new windows may take a moment to render
        setTimeout(() => {
          try {
            if (printWindow && !printWindow.closed) {
              printWindow.focus();
              printWindow.print();
            }
          } catch (e) {
            // Some browsers may block print() on cross-origin content
            // The PDF viewer will still be open for manual printing
            console.log("Auto-print not available, user can print manually");
          }
          // Clean up the object URL after a delay
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 2000);
        }, 1000);
        
        toast({
          title: "Print dialog opening",
          description: `Payslip for ${payslip.employee.name} is ready to print`,
        });
      } else {
        // If popup was blocked, fallback to download
        toast({
          title: "Popup blocked",
          description: "Please allow popups or use the download option",
          variant: "destructive",
        });
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Print failed:", error);
      toast({
        title: "Print failed",
        description: "Failed to generate PDF for printing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
            <p className="text-muted-foreground">
              Process payroll and manage employee payslips
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              {currentPeriod}
            </Button>
            <Button>
              <DollarSign className="mr-2 h-4 w-4" />
              Process Payroll
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Total Payroll</p>
          <p className="text-2xl font-bold">
            {formatCurrency(totalPayroll, currency)}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-success">
            {formatCurrency(paidAmount, currency)}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-warning">
            {formatCurrency(pendingAmount, currency)}
          </p>
        </Card>
        <Card variant="stat" className="p-4">
          <p className="text-sm text-muted-foreground">Employees</p>
          <p className="text-2xl font-bold">{stats?.totalEmployees || payslips.length}</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search employees..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payslips Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Pay Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading payslips...
                  </TableCell>
                </TableRow>
              ) : filteredPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No payslips found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayslips.map((payslip) => {
                const status = statusConfig[payslip.status];
                const StatusIcon = status.icon;
                return (
                  <TableRow
                    key={payslip.id}
                    className="cursor-pointer"
                    onClick={() => handleOpenEmployeePayroll(payslip.employeeId)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${payslip.employee.avatar}`}
                          />
                          <AvatarFallback>
                            {payslip.employee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{payslip.employee.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {payslip.employee.position}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{payslip.period}</TableCell>
                    <TableCell>
                      {formatCurrency(payslip.basicSalary, currency)}
                    </TableCell>
                    <TableCell className="text-success">
                      +{formatCurrency(payslip.allowances, currency)}
                    </TableCell>
                    <TableCell className="text-destructive">
                      -{formatCurrency(payslip.deductions, currency)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payslip.netPay, currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payslip.payDate}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(event) => {
                            event.stopPropagation();
                            handleViewPayslip(payslip);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Payslip
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDownloadPDF(payslip);
                            }}
                            disabled={downloadingId === payslip.id}
                          >
                            {downloadingId === payslip.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="mr-2 h-4 w-4" />
                            )}
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(event) => {
                              event.stopPropagation();
                              handlePrint(payslip);
                            }}
                            disabled={printingId === payslip.id}
                          >
                            {printingId === payslip.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Printer className="mr-2 h-4 w-4" />
                            )}
                            Print
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payslip Dialog */}
      <PayslipDialog
        payslip={selectedPayslip}
        open={isPayslipDialogOpen}
        onOpenChange={setIsPayslipDialogOpen}
      />
    </DashboardLayout>
  );
};

export default Payroll;
