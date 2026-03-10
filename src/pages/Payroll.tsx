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
import { generatePayslipPDF, downloadPDF, Payslip, PayslipComponent } from "@/components/payroll/PayslipPDF";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/hooks/useCompany";
import { usePayslips, usePayslipStats } from "@/hooks/usePayslips";
import { useEmployees } from "@/hooks/useEmployees";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PayslipDisplay {
  id: string;
  employeeId: string;
  hasGeneratedPayslip: boolean;
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
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isPayslipDialogOpen, setIsPayslipDialogOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const { data: company } = useCompany();
  const { data: payslipsData, isLoading } = usePayslips();
  const { data: stats } = usePayslipStats();
  const { data: employeesData } = useEmployees();
  const currency = company?.currency || "INR";

  const { data: employeeSalaryDetails = [], isLoading: isLoadingSalaryDetails } = useQuery({
    queryKey: ["employee-details", company?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("employee_details")
        .select("*")
        .eq("company_id", company?.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  const getCustomComponents = (employeeDetails: any): Array<{ label: string; monthly: number }> => {
    if (!employeeDetails?.custom_salary_components || !Array.isArray(employeeDetails.custom_salary_components)) {
      return [];
    }

    return employeeDetails.custom_salary_components
      .map((component: any) => ({
        label: String(component?.label || "").trim(),
        monthly: Number(component?.monthly || 0),
      }))
      .filter((component: { label: string; monthly: number }) => component.label.length > 0 && component.monthly !== 0);
  };

  const hasFilledSalaryData = (employeeDetails: any) => {
    const customComponents = getCustomComponents(employeeDetails);
    const hasCustomValues = customComponents.some((component) => component.monthly !== 0);

    return (
      Number(employeeDetails?.annual_ctc || 0) > 0 ||
      Number(employeeDetails?.monthly_ctc || 0) > 0 ||
      Number(employeeDetails?.basic_monthly || 0) > 0 ||
      Number(employeeDetails?.total_monthly_ctc || 0) > 0 ||
      hasCustomValues
    );
  };

  const getAmountsFromEmployeeDetails = (details: any) => {
    const basicSalary = Number(details?.basic_monthly || 0);
    const houseRentAllowance = Number(details?.house_rent_allowance_monthly || 0);
    const conveyanceAllowance = Number(details?.conveyance_allowance_monthly || 0);
    const medicalReimbursement = Number(details?.medical_reimbursement_monthly || 0);
    const otherBenefit = Number(details?.other_benefit_monthly || 0);
    const specialAllowance = Number(details?.special_allowance_monthly || 0);

    const customComponents = getCustomComponents(details);
    const customEarnings = customComponents
      .filter((component) => component.monthly > 0)
      .reduce((sum, component) => sum + component.monthly, 0);
    const customDeductions = customComponents
      .filter((component) => component.monthly < 0)
      .reduce((sum, component) => sum + Math.abs(component.monthly), 0);

    const allowances = houseRentAllowance + conveyanceAllowance + medicalReimbursement + otherBenefit + specialAllowance + customEarnings;
    const deductions = 200 + customDeductions;
    const netPay = basicSalary + allowances - deductions;

    return {
      basicSalary,
      allowances,
      deductions,
      netPay,
    };
  };

  // Convert PayslipDisplay to Payslip format
  const convertToPayslip = async (payslipDisplay: PayslipDisplay, payslipData: any): Promise<Payslip> => {
    const periodStart = new Date(payslipData.period_start);
    const periodEnd = new Date(payslipData.period_end);
    const period = format(periodStart, "MMMM yyyy");
    
    // Calculate days in period
    const daysInMonth = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const paidDays = daysInMonth;
    const lopDays = 0;

    // Try to fetch employee_details for salary breakdown
    let employeeDetails: any = null;
    let employeeUuid: string | null = payslipDisplay.employeeId;
    
    // If employeeId is employee_number, we need to get the UUID first
    if (employeeUuid) {
      try {
        // Check if it's a UUID format, if not, it's probably employee_number
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeUuid);
        
        if (!isUUID) {
          // It's employee_number, get UUID from employees table
          const { data: empData } = await supabase
            .from("employees")
            .select("id")
            .eq("employee_number", employeeUuid)
            .maybeSingle();
          
          if (empData) {
            employeeUuid = empData.id;
          }
        }
        
        // Now fetch employee_details using UUID
        const { data } = await (supabase as any)
          .from("employee_details")
          .select("*")
          .eq("employee_id", employeeUuid)
          .maybeSingle();
        employeeDetails = data;
      } catch (error) {
        console.log("Could not fetch employee_details:", error);
      }
    }

    // Calculate salary components from employee_details if available
    const basicMonthly = employeeDetails?.basic_monthly || Number(payslipDisplay.basicSalary || 0);
    const houseRentMonthly = employeeDetails?.house_rent_allowance_monthly || (basicMonthly * 0.4); // 40% of basic
    
    // Use employee_details if available, otherwise calculate from allowances
    const totalAllowances = Number(payslipDisplay.allowances || 0);
    const conveyanceMonthly = employeeDetails?.conveyance_allowance_monthly || (totalAllowances * 0.2);
    const medicalMonthly = employeeDetails?.medical_reimbursement_monthly || (totalAllowances * 0.15);
    const otherBenefitMonthly = employeeDetails?.other_benefit_monthly || (totalAllowances * 0.25);
    const specialAllowanceMonthly = employeeDetails?.special_allowance_monthly || (totalAllowances * 0.4);

    // Professional Tax is common for all employees (₹200.00)
    const professionalTax = 200.00;

    // Calculate YTD by counting payslips from start of year
    const payslipYear = periodStart.getFullYear();
    const yearStart = new Date(payslipYear, 0, 1);
    let ytdMultiplier = 1;
    
    if (employeeUuid) {
      try {
        const { data: payslipsData } = await supabase
          .from("payslips")
          .select("id")
          .eq("employee_id", employeeUuid)
          .gte("period_start", yearStart.toISOString().split('T')[0])
          .lte("period_start", periodEnd.toISOString().split('T')[0]);
        
        if (payslipsData) {
          ytdMultiplier = payslipsData.length || 1;
        }
      } catch (error) {
        console.log("Could not fetch payslips for YTD:", error);
        // Fallback to month-based calculation
        const currentMonth = new Date().getMonth();
        const payslipMonth = periodStart.getMonth();
        const currentYear = new Date().getFullYear();
        ytdMultiplier = (payslipYear === currentYear && payslipMonth <= currentMonth) 
          ? (payslipMonth + 1) 
          : 12;
      }
    }

    const customComponents = getCustomComponents(employeeDetails);
    const customEarnings: PayslipComponent[] = customComponents
      .filter((component) => component.monthly > 0)
      .map((component) => ({
        label: component.label,
        amount: component.monthly,
        ytd: component.monthly * ytdMultiplier,
      }));
    const customDeductions: PayslipComponent[] = customComponents
      .filter((component) => component.monthly < 0)
      .map((component) => ({
        label: component.label,
        amount: Math.abs(component.monthly),
        ytd: Math.abs(component.monthly) * ytdMultiplier,
      }));

    const earnings = {
      basic: basicMonthly,
      houseRentAllowance: houseRentMonthly,
      conveyanceAllowance: conveyanceMonthly,
      medicalReimbursement: medicalMonthly,
      otherBenefit: otherBenefitMonthly,
      specialAllowance: specialAllowanceMonthly,
    };

    const earningsYTD = {
      basic: basicMonthly * ytdMultiplier,
      houseRentAllowance: houseRentMonthly * ytdMultiplier,
      conveyanceAllowance: conveyanceMonthly * ytdMultiplier,
      medicalReimbursement: medicalMonthly * ytdMultiplier,
      otherBenefit: otherBenefitMonthly * ytdMultiplier,
      specialAllowance: specialAllowanceMonthly * ytdMultiplier,
    };

    const deductions = {
      professionalTax: professionalTax,
    };

    const deductionsYTD = {
      professionalTax: professionalTax * ytdMultiplier,
    };

    const customEarningsTotal = customEarnings.reduce((sum, component) => sum + component.amount, 0);
    const customDeductionsTotal = customDeductions.reduce((sum, component) => sum + component.amount, 0);
    const grossEarnings = basicMonthly + houseRentMonthly + conveyanceMonthly + 
                medicalMonthly + otherBenefitMonthly + specialAllowanceMonthly + customEarningsTotal;
    const totalDeductions = professionalTax + customDeductionsTotal;
    const netPay = grossEarnings - totalDeductions;

    // Fetch employee details for bank account
    const employee = payslipData.employees;
    let bankAccountNo: string | undefined;
    if (employeeDetails?.account_number) {
      bankAccountNo = employeeDetails.account_number;
    }

    return {
      id: payslipDisplay.id,
      employee: {
        name: employeeDetails?.name || payslipDisplay.employee.name,
        position: employeeDetails?.designation || payslipDisplay.employee.position,
        employeeId: employee?.employee_number || undefined,
        dateOfJoining: employeeDetails?.date_of_joining || employee?.hire_date || undefined,
        bankAccountNo: employeeDetails?.account_number || bankAccountNo,
        avatar: payslipDisplay.employee.avatar,
      },
      period,
      payDate: payslipData.pay_date || periodEnd.toISOString(),
      paidDays,
      lopDays,
      earnings,
      earningsYTD,
      deductions,
      deductionsYTD,
      customEarnings,
      customDeductions,
      grossEarnings,
      totalDeductions,
      netPay,
      status: payslipDisplay.status,
    };
  };

  // Transform database payslips to display format
  const payslipRows: PayslipDisplay[] = (payslipsData || []).map((payslip) => {
    const employee = payslip.employees;
    const periodStart = new Date(payslip.period_start);
    const period = format(periodStart, "MMMM yyyy");
    const employeeDetails = (employeeSalaryDetails || []).find((details: any) => details.employee_id === payslip.employee_id);
    const hasSalaryDetails = hasFilledSalaryData(employeeDetails);
    const salaryAmounts = hasSalaryDetails
      ? getAmountsFromEmployeeDetails(employeeDetails)
      : {
          basicSalary: Number(payslip.basic_salary),
          allowances: Number(payslip.allowances || 0),
          deductions: Number(payslip.deductions || 0),
          netPay: Number(payslip.net_pay),
        };
    
    return {
      id: payslip.id,
      employeeId: payslip.employee_id,
      hasGeneratedPayslip: true,
      employee: {
        name: employee?.full_name || "Unknown Employee",
        position: employee?.position || "N/A",
        email: employee?.email || undefined,
        avatar: employee?.email || employee?.full_name || "employee",
      },
      period,
      basicSalary: salaryAmounts.basicSalary,
      allowances: salaryAmounts.allowances,
      deductions: salaryAmounts.deductions,
      netPay: salaryAmounts.netPay,
      status: (payslip.status as "paid" | "pending" | "processing") || "pending",
      payDate: payslip.pay_date ? format(new Date(payslip.pay_date), "MMM d, yyyy") : "N/A",
    };
  });

  const currentPeriod = payslipRows.length > 0
    ? payslipRows[0].period
    : format(new Date(), "MMMM yyyy");

  const payslipEmployeeIds = new Set(payslipRows.map((row) => row.employeeId));

  const salaryOnlyRows: PayslipDisplay[] = (employeeSalaryDetails || [])
    .filter((details: any) => details?.employee_id && hasFilledSalaryData(details))
    .filter((details: any) => !payslipEmployeeIds.has(String(details.employee_id)))
    .map((details: any) => {
      const employee = (employeesData || []).find((entry) => entry.id === details.employee_id);
      const salaryAmounts = getAmountsFromEmployeeDetails(details);

      return {
        id: `salary-${details.employee_id}`,
        employeeId: String(details.employee_id),
        hasGeneratedPayslip: false,
        employee: {
          name: details?.name || employee?.full_name || "Unknown Employee",
          position: details?.designation || employee?.position || "N/A",
          email: employee?.email || undefined,
          avatar: employee?.email || employee?.full_name || details?.name || "employee",
        },
        period: currentPeriod,
        basicSalary: salaryAmounts.basicSalary,
        allowances: salaryAmounts.allowances,
        deductions: salaryAmounts.deductions,
        netPay: salaryAmounts.netPay,
        status: "pending",
        payDate: "N/A",
      };
    });

  const payslips: PayslipDisplay[] = [...payslipRows, ...salaryOnlyRows];

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

  const handleViewPayslip = async (payslipDisplay: PayslipDisplay) => {
    if (!payslipDisplay.hasGeneratedPayslip) {
      toast({
        title: "Payslip not generated",
        description: "Salary details are available, but payslip PDF is not generated for this employee yet.",
      });
      return;
    }

    const payslipData = payslipsData?.find(p => p.id === payslipDisplay.id);
    if (!payslipData) return;
    
    const payslip = await convertToPayslip(payslipDisplay, payslipData);
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

  const handleDownloadPDF = async (payslipDisplay: PayslipDisplay) => {
    if (!payslipDisplay.hasGeneratedPayslip) {
      toast({
        title: "Payslip not generated",
        description: "Generate a payslip for this employee before downloading.",
      });
      return;
    }

    try {
      setDownloadingId(payslipDisplay.id);
      
      const payslipData = payslipsData?.find(p => p.id === payslipDisplay.id);
      if (!payslipData) {
        throw new Error("Payslip data not found");
      }
      
      const payslip = await convertToPayslip(payslipDisplay, payslipData);
      const blob = await generatePayslipPDF(
        payslip,
        "Techvitta Innovations Pvt Ltd",
        "Plot No 19, Opp Cyber Pearl, Hitech City, Madhapur, Hyderabad Telangana 500081\nIndia"
      );
      
      const filename = `Payslip_${payslip.employee.employeeId || payslip.id}_${payslip.period.replace(/\s+/g, "_")}.pdf`;
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

  const handlePrint = async (payslipDisplay: PayslipDisplay) => {
    if (!payslipDisplay.hasGeneratedPayslip) {
      toast({
        title: "Payslip not generated",
        description: "Generate a payslip for this employee before printing.",
      });
      return;
    }

    try {
      setPrintingId(payslipDisplay.id);
      
      const payslipData = payslipsData?.find(p => p.id === payslipDisplay.id);
      if (!payslipData) {
        throw new Error("Payslip data not found");
      }
      
      const payslip = await convertToPayslip(payslipDisplay, payslipData);
      const blob = await generatePayslipPDF(
        payslip,
        "Techvitta Innovations Pvt Ltd",
        "Plot No 19, Opp Cyber Pearl, Hitech City, Madhapur, Hyderabad Telangana 500081\nIndia"
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
              {isLoading || isLoadingSalaryDetails ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading payroll data...
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
