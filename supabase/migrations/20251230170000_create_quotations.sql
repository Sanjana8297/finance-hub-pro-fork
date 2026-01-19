-- Create quotations table
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT NOT NULL UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  company_name TEXT,
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  sales_person TEXT,
  account_manager TEXT,
  currency TEXT DEFAULT 'INR',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'converted', 'expired')),
  version INTEGER DEFAULT 1,
  parent_quotation_id UUID REFERENCES public.quotations(id),
  converted_to_invoice_id UUID REFERENCES public.invoices(id),
  validity_days INTEGER DEFAULT 15,
  support_period_months INTEGER DEFAULT 3,
  change_request_policy TEXT,
  ip_ownership TEXT,
  payment_delay_penalties TEXT,
  payment_terms TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quotation_items table
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  rate DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quotation_technical_scope table
CREATE TABLE IF NOT EXISTS public.quotation_technical_scope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  scope_item TEXT NOT NULL,
  description TEXT,
  timeline_estimate TEXT,
  is_included BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quotation_deliverables table
CREATE TABLE IF NOT EXISTS public.quotation_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  deliverable_name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quotation_milestones table
CREATE TABLE IF NOT EXISTS public.quotation_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  duration_days INTEGER,
  deliverable TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create service_templates table (for reusable service templates)
CREATE TABLE IF NOT EXISTS public.service_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT,
  default_rate DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quotations_company ON public.quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_number ON public.quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON public.quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_scope_quotation ON public.quotation_technical_scope(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_deliverables_quotation ON public.quotation_deliverables(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_milestones_quotation ON public.quotation_milestones(quotation_id);
CREATE INDEX IF NOT EXISTS idx_service_templates_company ON public.service_templates(company_id);

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_technical_scope ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotations
CREATE POLICY "Users can view quotations for their company"
  ON public.quotations FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid()) OR 
    public.is_admin(auth.uid())
  );

CREATE POLICY "Finance users can create quotations"
  ON public.quotations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (company_id = public.get_user_company_id(auth.uid()) OR public.is_admin(auth.uid()))
  );

CREATE POLICY "Finance users can update quotations"
  ON public.quotations FOR UPDATE
  USING (
    public.has_finance_access(auth.uid()) OR 
    created_by = auth.uid() OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete quotations"
  ON public.quotations FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for quotation_items
CREATE POLICY "Users can view quotation items"
  ON public.quotation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations 
      WHERE quotations.id = quotation_items.quotation_id 
      AND (quotations.company_id = public.get_user_company_id(auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Finance users can manage quotation items"
  ON public.quotation_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations 
      WHERE quotations.id = quotation_items.quotation_id 
      AND (public.has_finance_access(auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

-- RLS Policies for quotation_technical_scope
CREATE POLICY "Users can view quotation technical scope"
  ON public.quotation_technical_scope FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations 
      WHERE quotations.id = quotation_technical_scope.quotation_id 
      AND (quotations.company_id = public.get_user_company_id(auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Finance users can manage quotation technical scope"
  ON public.quotation_technical_scope FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations 
      WHERE quotations.id = quotation_technical_scope.quotation_id 
      AND (public.has_finance_access(auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

-- RLS Policies for quotation_deliverables
CREATE POLICY "Users can view quotation deliverables"
  ON public.quotation_deliverables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations 
      WHERE quotations.id = quotation_deliverables.quotation_id 
      AND (quotations.company_id = public.get_user_company_id(auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Finance users can manage quotation deliverables"
  ON public.quotation_deliverables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations 
      WHERE quotations.id = quotation_deliverables.quotation_id 
      AND (public.has_finance_access(auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

-- RLS Policies for quotation_milestones
CREATE POLICY "Users can view quotation milestones"
  ON public.quotation_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations 
      WHERE quotations.id = quotation_milestones.quotation_id 
      AND (quotations.company_id = public.get_user_company_id(auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Finance users can manage quotation milestones"
  ON public.quotation_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations 
      WHERE quotations.id = quotation_milestones.quotation_id 
      AND (public.has_finance_access(auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

-- RLS Policies for service_templates
CREATE POLICY "Users can view service templates for their company"
  ON public.service_templates FOR SELECT
  USING (
    company_id = public.get_user_company_id(auth.uid()) OR 
    public.is_admin(auth.uid())
  );

CREATE POLICY "Finance users can manage service templates"
  ON public.service_templates FOR ALL
  USING (
    public.has_finance_access(auth.uid()) OR 
    public.is_admin(auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_templates_updated_at
BEFORE UPDATE ON public.service_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
