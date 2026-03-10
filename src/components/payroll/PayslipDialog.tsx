import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { formatCurrency, numberToWords } from "@/lib/utils";
import { format } from "date-fns";
import { Payslip } from "./PayslipPDF";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PayslipDialogProps {
  payslip: Payslip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function PayslipDialog({
  payslip,
  open,
  onOpenChange,
}: PayslipDialogProps) {
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!payslip) return;
      
      setIsLoadingDetails(true);
      try {
        // First, get employee UUID from employee_number if we only have employee_number
        let employeeUuid: string | null = null;
        
        if (payslip.employee.employeeId) {
          // Try to find employee by employee_number to get UUID
          const { data: employeeData } = await supabase
            .from("employees")
            .select("id")
            .eq("employee_number", payslip.employee.employeeId)
            .maybeSingle();
          
          if (employeeData) {
            employeeUuid = employeeData.id;
          }
        }
        
        // If we couldn't find by employee_number, try to get from payslip id
        if (!employeeUuid && payslip.id) {
          const { data: payslipData } = await supabase
            .from("payslips")
            .select("employee_id")
            .eq("id", payslip.id)
            .maybeSingle();
          
          if (payslipData?.employee_id) {
            employeeUuid = payslipData.employee_id;
          }
        }
        
        if (!employeeUuid) {
          setIsLoadingDetails(false);
          return;
        }
        
        // Fetch employee_details using the UUID
        const { data: empDetails, error: empError } = await (supabase as any)
          .from("employee_details")
          .select("*")
          .eq("employee_id", employeeUuid)
          .maybeSingle();

        if (empError) {
          console.error("Failed to load employee_details:", empError);
        } else {
          setEmployeeDetails(empDetails);
        }
      } catch (error) {
        console.error("Error fetching employee details:", error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    if (open && payslip) {
      fetchEmployeeDetails();
    }
  }, [open, payslip]);

  if (!payslip) return null;

  const status = statusConfig[payslip.status];
  const StatusIcon = status.icon;

  // Use employee_details data if available, otherwise fallback to payslip data
  const employeeName = employeeDetails?.name || payslip.employee.name;
  const designation = employeeDetails?.designation || payslip.employee.position;
  const employeeId = payslip.employee.employeeId || employeeDetails?.employee_id;
  const dateOfJoining = employeeDetails?.date_of_joining || payslip.employee.dateOfJoining;
  const bankAccountNo = employeeDetails?.account_number || payslip.employee.bankAccountNo;

  // Calculate earnings from employee_details table
  const calculateEarningsFromEmployeeDetails = () => {
    if (!employeeDetails) {
      // Fallback to payslip data
      return {
        basic: payslip.earnings.basic,
        houseRentAllowance: payslip.earnings.houseRentAllowance,
        conveyanceAllowance: payslip.earnings.conveyanceAllowance,
        medicalReimbursement: payslip.earnings.medicalReimbursement,
        otherBenefit: payslip.earnings.otherBenefit,
        specialAllowance: payslip.earnings.specialAllowance,
        grossEarnings: payslip.grossEarnings,
      };
    }

    const basic = Number(employeeDetails.basic_monthly || 0);
    const houseRentAllowance = Number(employeeDetails.house_rent_allowance_monthly || 0);
    const conveyanceAllowance = Number(employeeDetails.conveyance_allowance_monthly || 0);
    const medicalReimbursement = Number(employeeDetails.medical_reimbursement_monthly || 0);
    const otherBenefit = Number(employeeDetails.other_benefit_monthly || 0);
    const specialAllowance = Number(employeeDetails.special_allowance_monthly || 0);
    
    const grossEarnings = basic + houseRentAllowance + conveyanceAllowance + 
                          medicalReimbursement + otherBenefit + specialAllowance;

    return {
      basic,
      houseRentAllowance,
      conveyanceAllowance,
      medicalReimbursement,
      otherBenefit,
      specialAllowance,
      grossEarnings,
    };
  };

  const earnings = calculateEarningsFromEmployeeDetails();

  const customComponents = Array.isArray(employeeDetails?.custom_salary_components)
    ? employeeDetails.custom_salary_components
        .map((component: any) => ({
          label: String(component?.label || "").trim(),
          monthly: Number(component?.monthly || 0),
        }))
        .filter((component: { label: string; monthly: number }) => component.label.length > 0 && component.monthly !== 0)
    : [];
  const customEarnings = customComponents.filter((component: { label: string; monthly: number }) => component.monthly > 0);
  const customDeductions = customComponents.filter((component: { label: string; monthly: number }) => component.monthly < 0);
  
  // Professional Tax is common for all employees (₹200.00)
  const professionalTax = 200.00;
  const totalCustomEarnings = customEarnings.reduce(
    (sum: number, component: { label: string; monthly: number }) => sum + component.monthly,
    0
  );
  const totalCustomDeductions = customDeductions.reduce(
    (sum: number, component: { label: string; monthly: number }) => sum + Math.abs(component.monthly),
    0
  );
  const grossEarnings = earnings.grossEarnings + totalCustomEarnings;
  const totalDeductions = professionalTax + totalCustomDeductions;
  const netPay = grossEarnings - totalDeductions;

  // Calculate YTD values as annual values (monthly * 12)
  const earningsYTD = {
    basic: earnings.basic * 12,
    houseRentAllowance: earnings.houseRentAllowance * 12,
    conveyanceAllowance: earnings.conveyanceAllowance * 12,
    medicalReimbursement: earnings.medicalReimbursement * 12,
    otherBenefit: earnings.otherBenefit * 12,
    specialAllowance: earnings.specialAllowance * 12,
  };

  const customEarningsYTD = customEarnings.map((component: { label: string; monthly: number }) => ({
    label: component.label,
    monthly: component.monthly,
    ytd: component.monthly * 12,
  }));

  const customDeductionsYTD = customDeductions.map((component: { label: string; monthly: number }) => ({
    label: component.label,
    monthly: Math.abs(component.monthly),
    ytd: Math.abs(component.monthly) * 12,
  }));

  const deductionsYTD = {
    professionalTax: professionalTax * 12,
  };

  const earningRows = [
    { label: "Basic", amount: earnings.basic, ytd: earningsYTD.basic },
    { label: "House Rent Allowance", amount: earnings.houseRentAllowance, ytd: earningsYTD.houseRentAllowance },
    { label: "Conveyance Allowance", amount: earnings.conveyanceAllowance, ytd: earningsYTD.conveyanceAllowance },
    { label: "Medical Reimbursement", amount: earnings.medicalReimbursement, ytd: earningsYTD.medicalReimbursement },
    { label: "Other Benefit", amount: earnings.otherBenefit, ytd: earningsYTD.otherBenefit },
    { label: "Special Allowance", amount: earnings.specialAllowance, ytd: earningsYTD.specialAllowance },
    ...customEarningsYTD.map((component: { label: string; monthly: number; ytd: number }) => ({
      label: component.label,
      amount: component.monthly,
      ytd: component.ytd,
    })),
  ];

  const deductionRows = [
    { label: "Professional Tax", amount: professionalTax, ytd: deductionsYTD.professionalTax },
    ...customDeductionsYTD.map((component: { label: string; monthly: number; ytd: number }) => ({
      label: component.label,
      amount: component.monthly,
      ytd: component.ytd,
    })),
  ];

  const rowCount = Math.max(earningRows.length, deductionRows.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payslip Details</DialogTitle>
          <DialogDescription>
            Pay period: {payslip.period}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Header - Matching Reference PDF */}
          <div className="flex justify-between items-start">
            {/* Company Name and Address - Left Aligned */}
            <div className="space-y-1 flex-1">
              <h1 className="text-xl font-bold">Techvitta Innovations Pvt Ltd</h1>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                Plot No 19, Opp Cyber Pearl, Hitech City, Madhapur, Hyderabad Telangana 500081{'\n'}India
              </p>
            </div>
            
            {/* Payslip For the Month - Right Aligned */}
            <div className="text-right">
              <p className="text-sm font-semibold">Payslip For the Month</p>
              <p className="text-sm font-semibold">{payslip.period}</p>
            </div>
          </div>

          {/* Employee Summary Section - Matching Reference PDF */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-bold mb-4"># EMPLOYEE SUMMARY</h2>
            
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-sm font-semibold min-w-[160px]">Employee Name :</span>
                  <span className="text-sm">{employeeName}</span>
                </div>
                
                <div className="flex items-start">
                  <span className="text-sm font-semibold min-w-[160px]">Designation :</span>
                  <span className="text-sm">{designation}</span>
                </div>
                
                {employeeId && (
                  <div className="flex items-start">
                    <span className="text-sm font-semibold min-w-[160px]">Employee ID :</span>
                    <span className="text-sm">{employeeId}</span>
                  </div>
                )}
                
                {dateOfJoining && (
                  <div className="flex items-start">
                    <span className="text-sm font-semibold min-w-[160px]">Date of Joining :</span>
                    <span className="text-sm">
                      {format(new Date(dateOfJoining), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}
                
                <div className="flex items-start">
                  <span className="text-sm font-semibold min-w-[160px]">Pay Period :</span>
                  <span className="text-sm">{payslip.period}</span>
                </div>
                
                <div className="flex items-start">
                  <span className="text-sm font-semibold min-w-[160px]">Pay Date :</span>
                  <span className="text-sm">
                    {format(new Date(payslip.payDate), "dd/MM/yyyy")}
                  </span>
                </div>

                {/* Total Net Pay - Prominently Displayed */}
                <div className="pt-4 border-t mt-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold mb-2">
                      {formatCurrency(netPay, "INR")}
                    </p>
                    <p className="text-sm font-semibold mb-4">Total Net Pay</p>
                  </div>
                </div>

                {/* Paid Days and LOP Days */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Paid Days :</span>
                    <span className="text-sm">{payslip.paidDays}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">LOP Days :</span>
                    <span className="text-sm">{payslip.lopDays}</span>
                  </div>
                </div>

                {bankAccountNo && (
                  <div className="flex items-start pt-2">
                    <span className="text-sm font-semibold min-w-[160px]">Bank Account No :</span>
                    <span className="text-sm">{bankAccountNo}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Earnings and Deductions Table */}
          <div className="border rounded-lg overflow-hidden w-full">
            <div className="bg-muted p-4">
              <div className="grid grid-cols-6 gap-2 text-sm font-semibold w-full">
                <div className="col-span-1">EARNINGS</div>
                <div className="text-right">AMOUNT</div>
                <div className="text-right">YTD</div>
                <div className="col-span-1">DEDUCTIONS</div>
                <div className="text-right">AMOUNT</div>
                <div className="text-right">YTD</div>
              </div>
            </div>
            <div className="divide-y">
              {Array.from({ length: rowCount }).map((_, index) => {
                const earning = earningRows[index];
                const deduction = deductionRows[index];

                return (
                  <div key={`payslip-row-${index}`} className="grid grid-cols-6 gap-2 p-4 w-full">
                    <div className="col-span-1">{earning?.label || ""}</div>
                    <div className="text-right">{earning ? formatCurrency(earning.amount, "INR") : ""}</div>
                    <div className="text-right">{earning ? formatCurrency(earning.ytd, "INR") : ""}</div>
                    <div className="col-span-1">{deduction?.label || ""}</div>
                    <div className="text-right">{deduction ? formatCurrency(deduction.amount, "INR") : ""}</div>
                    <div className="text-right">{deduction ? formatCurrency(deduction.ytd, "INR") : ""}</div>
                  </div>
                );
              })}

              {/* Totals */}
              <div className="grid grid-cols-6 gap-2 p-4 bg-muted font-semibold w-full">
                <div className="col-span-1">Gross Earnings</div>
                <div className="text-right">{formatCurrency(grossEarnings, "INR")}</div>
                <div></div>
                <div className="col-span-1">Total Deductions</div>
                <div className="text-right">{formatCurrency(totalDeductions, "INR")}</div>
                <div></div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Payable */}
          <div className="rounded-lg border-2 bg-muted/50 p-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">TOTAL NET PAYABLE</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(netPay, "INR")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Gross Earnings - Total Deductions
              </p>
              <p className="text-sm italic text-muted-foreground mt-2">
                Amount In Words: Indian Rupee {numberToWords(netPay)}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
