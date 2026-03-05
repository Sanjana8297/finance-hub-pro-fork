-- Create employee_details table for Payroll Employee Details page data
CREATE TABLE IF NOT EXISTS public.employee_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Overview: Basic Information
  name TEXT NOT NULL,
  basic_email_address TEXT,
  mobile_number TEXT,
  date_of_joining DATE,
  gender TEXT,
  work_location TEXT,
  designation TEXT,
  departments TEXT,

  -- Overview: Personal Information
  date_of_birth DATE,
  fathers_name TEXT,
  pan TEXT,
  personal_email_address TEXT,
  residential_address TEXT,
  differently_abled_type TEXT,

  -- Overview: Payment Information
  payment_mode TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  bank_name TEXT,
  ifsc TEXT,
  account_type TEXT,

  -- Salary Details
  annual_ctc NUMERIC(14,2) NOT NULL DEFAULT 0,
  monthly_ctc NUMERIC(14,2) NOT NULL DEFAULT 0,
  basic_monthly NUMERIC(14,2) NOT NULL DEFAULT 0,
  basic_annual NUMERIC(14,2) NOT NULL DEFAULT 0,
  house_rent_allowance_monthly NUMERIC(14,2) NOT NULL DEFAULT 0,
  house_rent_allowance_annual NUMERIC(14,2) NOT NULL DEFAULT 0,
  conveyance_allowance_monthly NUMERIC(14,2) NOT NULL DEFAULT 0,
  medical_reimbursement_monthly NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_benefit_monthly NUMERIC(14,2) NOT NULL DEFAULT 0,
  special_allowance_monthly NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_monthly_ctc NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_annual_ctc NUMERIC(14,2) NOT NULL DEFAULT 0,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT employee_details_annual_ctc_non_negative CHECK (annual_ctc >= 0),
  CONSTRAINT employee_details_monthly_ctc_non_negative CHECK (monthly_ctc >= 0),
  CONSTRAINT employee_details_component_values_non_negative CHECK (
    basic_monthly >= 0 AND
    basic_annual >= 0 AND
    house_rent_allowance_monthly >= 0 AND
    house_rent_allowance_annual >= 0 AND
    conveyance_allowance_monthly >= 0 AND
    medical_reimbursement_monthly >= 0 AND
    other_benefit_monthly >= 0 AND
    special_allowance_monthly >= 0 AND
    total_monthly_ctc >= 0 AND
    total_annual_ctc >= 0
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_details_company_id ON public.employee_details(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_details_employee_id ON public.employee_details(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_details_pan ON public.employee_details(pan);

-- Enable RLS
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view employee details in their company"
  ON public.employee_details FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid()) OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "HR and finance users can create employee details"
  ON public.employee_details FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (company_id = public.get_user_company_id(auth.uid()) OR public.is_admin(auth.uid())) AND
    (
      public.has_role(auth.uid(), 'hr') OR
      public.has_finance_access(auth.uid()) OR
      public.is_admin(auth.uid())
    )
  );

CREATE POLICY "HR and finance users can update employee details"
  ON public.employee_details FOR UPDATE
  USING (
    company_id = public.get_user_company_id(auth.uid()) OR
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    (
      public.has_role(auth.uid(), 'hr') OR
      public.has_finance_access(auth.uid()) OR
      public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Only admins can delete employee details"
  ON public.employee_details FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_employee_details_updated_at ON public.employee_details;
CREATE TRIGGER update_employee_details_updated_at
BEFORE UPDATE ON public.employee_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
