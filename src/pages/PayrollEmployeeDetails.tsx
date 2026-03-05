import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompany } from "@/hooks/useCompany";
import { usePayslips } from "@/hooks/usePayslips";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const statusLabel: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  processing: "Processing",
};

const PayrollEmployeeDetails = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const { data: company } = useCompany();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const { data: payslipsData, isLoading } = usePayslips();
  const [basicInformation, setBasicInformation] = useState({
    name: "",
    emailAddress: "",
    mobileNumber: "",
    dateOfJoining: "",
    gender: "",
    workLocation: "",
    designation: "",
    departments: "",
  });
  const [personalInformation, setPersonalInformation] = useState({
    dateOfBirth: "",
    fathersName: "",
    pan: "",
    emailAddress: "",
    residentialAddress: "",
    differentlyAbledType: "",
  });
  const [paymentInformation, setPaymentInformation] = useState({
    paymentMode: "",
    accountNumber: "",
    accountHolderName: "",
    bankName: "",
    ifsc: "",
    accountType: "",
  });
  const [salaryDetails, setSalaryDetails] = useState({
    annualCtc: 0,
    conveyanceAllowance: 0,
    medicalReimbursement: 0,
    otherBenefit: 0,
    specialAllowance: 0,
  });
  const [isRevisingAnnualCtc, setIsRevisingAnnualCtc] = useState(false);
  const [annualCtcDraft, setAnnualCtcDraft] = useState("0");
  const [isSaving, setIsSaving] = useState(false);

  const employeePayslips = useMemo(() => {
    return (payslipsData || []).filter((payslip) => payslip.employee_id === employeeId);
  }, [employeeId, payslipsData]);

  const latestPayslip = employeePayslips[0];
  const employee = latestPayslip?.employees;
  const currency = company?.currency || "INR";

  useEffect(() => {
    setBasicInformation({
      name: employee?.full_name || "",
      emailAddress: employee?.email || "",
      mobileNumber: "",
      dateOfJoining: "",
      gender: "",
      workLocation: "",
      designation: employee?.position || "",
      departments: employee?.department || "",
    });

    setPersonalInformation({
      dateOfBirth: "",
      fathersName: "",
      pan: "",
      emailAddress: employee?.email || "",
      residentialAddress: "",
      differentlyAbledType: "",
    });

    setPaymentInformation({
      paymentMode: "Bank Transfer",
      accountNumber: "",
      accountHolderName: employee?.full_name || "",
      bankName: "",
      ifsc: "",
      accountType: "",
    });

    const annualCtc = Number(latestPayslip?.net_pay || 0) * 12;
    const monthlyCtc = annualCtc / 12;
    const basicMonthly = monthlyCtc * 0.5;
    const houseRentMonthly = basicMonthly * 0.4;
    const residual = Math.max(monthlyCtc - basicMonthly - houseRentMonthly, 0);

    setSalaryDetails({
      annualCtc,
      conveyanceAllowance: residual * 0.2,
      medicalReimbursement: residual * 0.15,
      otherBenefit: residual * 0.25,
      specialAllowance: residual * 0.4,
    });
    setAnnualCtcDraft(String(annualCtc));
    setIsRevisingAnnualCtc(false);
  }, [employee?.department, employee?.email, employee?.full_name, employee?.position]);

  const salaryBreakdown = useMemo(() => {
    if (!employeePayslips.length) {
      return {
        basicSalary: 0,
        averageAllowances: 0,
        averageDeductions: 0,
        averageNetPay: 0,
      };
    }

    const totalAllowances = employeePayslips.reduce((sum, payslip) => sum + Number(payslip.allowances || 0), 0);
    const totalDeductions = employeePayslips.reduce((sum, payslip) => sum + Number(payslip.deductions || 0), 0);
    const totalNetPay = employeePayslips.reduce((sum, payslip) => sum + Number(payslip.net_pay || 0), 0);

    return {
      basicSalary: Number(latestPayslip?.basic_salary || 0),
      averageAllowances: totalAllowances / employeePayslips.length,
      averageDeductions: totalDeductions / employeePayslips.length,
      averageNetPay: totalNetPay / employeePayslips.length,
    };
  }, [employeePayslips, latestPayslip?.basic_salary]);

  const canEditSalaryComponents = isAdmin();

  const monthlyCtc = salaryDetails.annualCtc / 12;
  const basicMonthly = monthlyCtc * 0.5;
  const basicAnnual = basicMonthly * 12;
  const houseRentMonthly = basicMonthly * 0.4;
  const houseRentAnnual = houseRentMonthly * 12;

  const salaryRows = [
    {
      key: "basic",
      label: "Basic",
      description: "50.00 % of CTC",
      monthly: basicMonthly,
      annual: basicAnnual,
      editable: false,
    },
    {
      key: "house-rent",
      label: "House Rent Allowance",
      description: "40.00 % of Basic Amount",
      monthly: houseRentMonthly,
      annual: houseRentAnnual,
      editable: false,
    },
    {
      key: "conveyance",
      label: "Conveyance Allowance",
      description: "Editable Component",
      monthly: salaryDetails.conveyanceAllowance,
      annual: salaryDetails.conveyanceAllowance * 12,
      editable: true,
      field: "conveyanceAllowance" as const,
    },
    {
      key: "medical",
      label: "Medical Reimbursement",
      description: "Editable Component",
      monthly: salaryDetails.medicalReimbursement,
      annual: salaryDetails.medicalReimbursement * 12,
      editable: true,
      field: "medicalReimbursement" as const,
    },
    {
      key: "other-benefit",
      label: "Other Benefit",
      description: "Editable Component",
      monthly: salaryDetails.otherBenefit,
      annual: salaryDetails.otherBenefit * 12,
      editable: true,
      field: "otherBenefit" as const,
    },
    {
      key: "special",
      label: "Special Allowance",
      description: "Editable Component",
      monthly: salaryDetails.specialAllowance,
      annual: salaryDetails.specialAllowance * 12,
      editable: true,
      field: "specialAllowance" as const,
    },
  ];

  const totalMonthlyCtc =
    basicMonthly +
    houseRentMonthly +
    salaryDetails.conveyanceAllowance +
    salaryDetails.medicalReimbursement +
    salaryDetails.otherBenefit +
    salaryDetails.specialAllowance;
  const totalAnnualCtc = salaryDetails.annualCtc;

  const parseCurrencyInput = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return 0;
    return Math.max(parsed, 0);
  };

  useEffect(() => {
    const loadEmployeeDetails = async () => {
      if (!employeeId || !company?.id) return;

      const { data, error } = await (supabase as any)
        .from("employee_details")
        .select("*")
        .eq("employee_id", employeeId)
        .maybeSingle();

      if (error) {
        console.error("Failed to load employee_details:", error);
        return;
      }

      if (!data) return;

      setBasicInformation({
        name: data.name || "",
        emailAddress: data.basic_email_address || "",
        mobileNumber: data.mobile_number || "",
        dateOfJoining: data.date_of_joining || "",
        gender: data.gender || "",
        workLocation: data.work_location || "",
        designation: data.designation || "",
        departments: data.departments || "",
      });

      setPersonalInformation({
        dateOfBirth: data.date_of_birth || "",
        fathersName: data.fathers_name || "",
        pan: data.pan || "",
        emailAddress: data.personal_email_address || "",
        residentialAddress: data.residential_address || "",
        differentlyAbledType: data.differently_abled_type || "",
      });

      setPaymentInformation({
        paymentMode: data.payment_mode || "",
        accountNumber: data.account_number || "",
        accountHolderName: data.account_holder_name || "",
        bankName: data.bank_name || "",
        ifsc: data.ifsc || "",
        accountType: data.account_type || "",
      });

      const loadedAnnualCtc = Number(data.annual_ctc || 0);
      setSalaryDetails({
        annualCtc: loadedAnnualCtc,
        conveyanceAllowance: Number(data.conveyance_allowance_monthly || 0),
        medicalReimbursement: Number(data.medical_reimbursement_monthly || 0),
        otherBenefit: Number(data.other_benefit_monthly || 0),
        specialAllowance: Number(data.special_allowance_monthly || 0),
      });
      setAnnualCtcDraft(String(loadedAnnualCtc));
    };

    loadEmployeeDetails();
  }, [employeeId, company?.id]);

  const handleSaveEmployeeDetails = async (sectionName: string) => {
    if (!employeeId || !company?.id) {
      toast({
        title: "Missing employee context",
        description: "Cannot save employee details right now.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        employee_id: employeeId,
        company_id: company.id,
        created_by: user?.id || null,

        name: basicInformation.name || "",
        basic_email_address: basicInformation.emailAddress || null,
        mobile_number: basicInformation.mobileNumber || null,
        date_of_joining: basicInformation.dateOfJoining || null,
        gender: basicInformation.gender || null,
        work_location: basicInformation.workLocation || null,
        designation: basicInformation.designation || null,
        departments: basicInformation.departments || null,

        date_of_birth: personalInformation.dateOfBirth || null,
        fathers_name: personalInformation.fathersName || null,
        pan: personalInformation.pan || null,
        personal_email_address: personalInformation.emailAddress || null,
        residential_address: personalInformation.residentialAddress || null,
        differently_abled_type: personalInformation.differentlyAbledType || null,

        payment_mode: paymentInformation.paymentMode || null,
        account_number: paymentInformation.accountNumber || null,
        account_holder_name: paymentInformation.accountHolderName || null,
        bank_name: paymentInformation.bankName || null,
        ifsc: paymentInformation.ifsc || null,
        account_type: paymentInformation.accountType || null,

        annual_ctc: totalAnnualCtc,
        monthly_ctc: monthlyCtc,
        basic_monthly: basicMonthly,
        basic_annual: basicAnnual,
        house_rent_allowance_monthly: houseRentMonthly,
        house_rent_allowance_annual: houseRentAnnual,
        conveyance_allowance_monthly: salaryDetails.conveyanceAllowance,
        medical_reimbursement_monthly: salaryDetails.medicalReimbursement,
        other_benefit_monthly: salaryDetails.otherBenefit,
        special_allowance_monthly: salaryDetails.specialAllowance,
        total_monthly_ctc: totalMonthlyCtc,
        total_annual_ctc: totalAnnualCtc,
      };

      const { error } = await (supabase as any)
        .from("employee_details")
        .upsert(payload, { onConflict: "employee_id" });

      if (error) throw error;

      toast({
        title: "Saved",
        description: `${sectionName} saved to employee details.`,
      });
    } catch (error) {
      console.error("Failed to save employee_details:", error);
      toast({
        title: "Save failed",
        description: `Could not save ${sectionName.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="outline" className="mb-4" onClick={() => navigate("/payroll")}> 
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payroll
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{employee?.full_name || "Employee Payroll"}</h1>
        <p className="text-muted-foreground">Payroll profile and payslip history</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="salary-details">Salary Details</TabsTrigger>
          <TabsTrigger value="payslips-forms">Payslips &amp; Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="basic-name">Name</Label>
                <Input
                  id="basic-name"
                  value={basicInformation.name}
                  onChange={(event) =>
                    setBasicInformation((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="basic-email-address">Email Address</Label>
                <Input
                  id="basic-email-address"
                  type="email"
                  value={basicInformation.emailAddress}
                  onChange={(event) =>
                    setBasicInformation((prev) => ({ ...prev, emailAddress: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="basic-mobile-number">Mobile Number</Label>
                <Input
                  id="basic-mobile-number"
                  value={basicInformation.mobileNumber}
                  onChange={(event) =>
                    setBasicInformation((prev) => ({ ...prev, mobileNumber: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="basic-date-of-joining">Date of Joining</Label>
                <Input
                  id="basic-date-of-joining"
                  type="date"
                  value={basicInformation.dateOfJoining}
                  onChange={(event) =>
                    setBasicInformation((prev) => ({ ...prev, dateOfJoining: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="basic-gender">Gender</Label>
                <Input
                  id="basic-gender"
                  value={basicInformation.gender}
                  onChange={(event) =>
                    setBasicInformation((prev) => ({ ...prev, gender: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="basic-work-location">Work Location</Label>
                <Input
                  id="basic-work-location"
                  value={basicInformation.workLocation}
                  onChange={(event) =>
                    setBasicInformation((prev) => ({ ...prev, workLocation: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="basic-designation">Designation</Label>
                <Input
                  id="basic-designation"
                  value={basicInformation.designation}
                  onChange={(event) =>
                    setBasicInformation((prev) => ({ ...prev, designation: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="basic-departments">Departments</Label>
                <Input
                  id="basic-departments"
                  value={basicInformation.departments}
                  onChange={(event) =>
                    setBasicInformation((prev) => ({ ...prev, departments: event.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="button" disabled={isSaving} onClick={() => handleSaveEmployeeDetails("Basic Information")}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="personal-date-of-birth">Date of Birth</Label>
                <Input
                  id="personal-date-of-birth"
                  type="date"
                  value={personalInformation.dateOfBirth}
                  onChange={(event) =>
                    setPersonalInformation((prev) => ({ ...prev, dateOfBirth: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="personal-fathers-name">Father&apos;s Name</Label>
                <Input
                  id="personal-fathers-name"
                  value={personalInformation.fathersName}
                  onChange={(event) =>
                    setPersonalInformation((prev) => ({ ...prev, fathersName: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="personal-pan">PAN</Label>
                <Input
                  id="personal-pan"
                  value={personalInformation.pan}
                  onChange={(event) =>
                    setPersonalInformation((prev) => ({ ...prev, pan: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="personal-email-address">Email Address</Label>
                <Input
                  id="personal-email-address"
                  type="email"
                  value={personalInformation.emailAddress}
                  onChange={(event) =>
                    setPersonalInformation((prev) => ({ ...prev, emailAddress: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="personal-residential-address">Residential Address</Label>
                <Input
                  id="personal-residential-address"
                  value={personalInformation.residentialAddress}
                  onChange={(event) =>
                    setPersonalInformation((prev) => ({ ...prev, residentialAddress: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="personal-differently-abled-type">Differently Abled Type</Label>
                <Input
                  id="personal-differently-abled-type"
                  value={personalInformation.differentlyAbledType}
                  onChange={(event) =>
                    setPersonalInformation((prev) => ({ ...prev, differentlyAbledType: event.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="button" disabled={isSaving} onClick={() => handleSaveEmployeeDetails("Personal Information")}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="payment-mode">payment Mode</Label>
                <Input
                  id="payment-mode"
                  value={paymentInformation.paymentMode}
                  onChange={(event) =>
                    setPaymentInformation((prev) => ({ ...prev, paymentMode: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payment-account-number">Account Number</Label>
                <Input
                  id="payment-account-number"
                  value={paymentInformation.accountNumber}
                  onChange={(event) =>
                    setPaymentInformation((prev) => ({ ...prev, accountNumber: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payment-account-holder-name">Account Holder Name</Label>
                <Input
                  id="payment-account-holder-name"
                  value={paymentInformation.accountHolderName}
                  onChange={(event) =>
                    setPaymentInformation((prev) => ({ ...prev, accountHolderName: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payment-bank-name">Bank Name</Label>
                <Input
                  id="payment-bank-name"
                  value={paymentInformation.bankName}
                  onChange={(event) =>
                    setPaymentInformation((prev) => ({ ...prev, bankName: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payment-ifsc">IFSC</Label>
                <Input
                  id="payment-ifsc"
                  value={paymentInformation.ifsc}
                  onChange={(event) =>
                    setPaymentInformation((prev) => ({ ...prev, ifsc: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="payment-account-type">Account Type</Label>
                <Input
                  id="payment-account-type"
                  value={paymentInformation.accountType}
                  onChange={(event) =>
                    setPaymentInformation((prev) => ({ ...prev, accountType: event.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="button" disabled={isSaving} onClick={() => handleSaveEmployeeDetails("Payment Information")}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary-details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Salary Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Annual CTC</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAnnualCtc, currency)} per year</p>
                  {canEditSalaryComponents && !isRevisingAnnualCtc && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setIsRevisingAnnualCtc(true)}
                    >
                      Revise
                    </Button>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly CTC</p>
                  <p className="text-2xl font-bold">{formatCurrency(monthlyCtc, currency)} per month</p>
                </div>
              </div>
              {canEditSalaryComponents && isRevisingAnnualCtc && (
                <div className="grid gap-3 sm:max-w-md">
                  <Label htmlFor="annual-ctc-revise">Revise Annual CTC</Label>
                  <Input
                    id="annual-ctc-revise"
                    type="number"
                    min="0"
                    value={annualCtcDraft}
                    onChange={(event) => setAnnualCtcDraft(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        const newAnnualCtc = parseCurrencyInput(annualCtcDraft);
                        setSalaryDetails((prev) => ({ ...prev, annualCtc: newAnnualCtc }));
                        setAnnualCtcDraft(String(newAnnualCtc));
                        setIsRevisingAnnualCtc(false);
                      }}
                    >
                      Apply
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAnnualCtcDraft(String(salaryDetails.annualCtc));
                        setIsRevisingAnnualCtc(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {!canEditSalaryComponents && (
                <p className="text-xs text-muted-foreground">
                  Only Admin and Super Admin can edit salary components. Basic and House Rent Allowance are always formula-based.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salary Structure</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salary Components</TableHead>
                    <TableHead className="text-right">Monthly Amount</TableHead>
                    <TableHead className="text-right">Annual Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>
                        <p className="font-medium">{row.label}</p>
                        <p className="text-xs text-muted-foreground">{row.description}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.editable && row.field ? (
                          <div className="flex justify-end">
                            <Input
                              type="number"
                              min="0"
                              className="w-36 text-right"
                              value={row.monthly}
                              disabled={!canEditSalaryComponents}
                              onChange={(event) => {
                                if (!canEditSalaryComponents) return;
                                const newValue = parseCurrencyInput(event.target.value);
                                setSalaryDetails((prev) => ({ ...prev, [row.field]: newValue }));
                              }}
                            />
                          </div>
                        ) : (
                          <span className="font-medium">{formatCurrency(row.monthly, currency)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(row.annual, currency)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>
                      <p className="text-lg font-semibold">Cost to Company</p>
                    </TableCell>
                    <TableCell className="text-right text-lg font-semibold">{formatCurrency(monthlyCtc, currency)}</TableCell>
                    <TableCell className="text-right text-lg font-semibold">{formatCurrency(totalAnnualCtc, currency)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {canEditSalaryComponents && (
            <div className="flex justify-end">
              <Button type="button" disabled={isSaving} onClick={() => handleSaveEmployeeDetails("Salary Details")}>
                Save Changes
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payslips-forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payslips &amp; Forms</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pay Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Loading employee payslips...
                      </TableCell>
                    </TableRow>
                  ) : employeePayslips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        No payslips available for this employee.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employeePayslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell>{format(new Date(payslip.period_start), "MMMM yyyy")}</TableCell>
                        <TableCell>{formatCurrency(Number(payslip.basic_salary || 0), currency)}</TableCell>
                        <TableCell className="text-success">+{formatCurrency(Number(payslip.allowances || 0), currency)}</TableCell>
                        <TableCell className="text-destructive">-{formatCurrency(Number(payslip.deductions || 0), currency)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(Number(payslip.net_pay || 0), currency)}</TableCell>
                        <TableCell>
                          <Badge variant={payslip.status === "paid" ? "success" : "warning"}>
                            {statusLabel[payslip.status || "pending"]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payslip.pay_date ? format(new Date(payslip.pay_date), "MMM d, yyyy") : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default PayrollEmployeeDetails;
