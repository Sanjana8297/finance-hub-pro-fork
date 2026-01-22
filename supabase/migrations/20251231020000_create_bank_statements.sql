-- Create bank_statements table
CREATE TABLE IF NOT EXISTS public.bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  statement_period_start DATE,
  statement_period_end DATE,
  total_debits DECIMAL(15, 2) DEFAULT 0,
  total_credits DECIMAL(15, 2) DEFAULT 0,
  opening_balance DECIMAL(15, 2) DEFAULT 0,
  closing_balance DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bank_statement_transactions table
CREATE TABLE IF NOT EXISTS public.bank_statement_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID REFERENCES public.bank_statements(id) ON DELETE CASCADE NOT NULL,
  transaction_date DATE NOT NULL,
  value_date DATE,
  description TEXT,
  reference_number TEXT,
  debit_amount DECIMAL(15, 2) DEFAULT 0,
  credit_amount DECIMAL(15, 2) DEFAULT 0,
  balance DECIMAL(15, 2),
  transaction_type TEXT, -- 'debit', 'credit', 'both'
  category TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bank_statements_company ON public.bank_statements(company_id);
CREATE INDEX IF NOT EXISTS idx_bank_statements_uploaded_by ON public.bank_statements(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_bank_statements_period ON public.bank_statements(statement_period_start, statement_period_end);
CREATE INDEX IF NOT EXISTS idx_bank_statement_transactions_statement ON public.bank_statement_transactions(statement_id);
CREATE INDEX IF NOT EXISTS idx_bank_statement_transactions_date ON public.bank_statement_transactions(transaction_date);

-- Enable RLS
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statement_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_statements
CREATE POLICY "Users can view bank statements for their company" 
  ON public.bank_statements FOR SELECT 
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create bank statements for their company" 
  ON public.bank_statements FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_admin(auth.uid())));

CREATE POLICY "Finance users can update bank statements" 
  ON public.bank_statements FOR UPDATE 
  USING (public.has_finance_access(auth.uid()) OR uploaded_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete bank statements" 
  ON public.bank_statements FOR DELETE 
  USING (public.is_admin(auth.uid()) OR uploaded_by = auth.uid());

-- RLS Policies for bank_statement_transactions
CREATE POLICY "Users can view transactions for their company statements" 
  ON public.bank_statement_transactions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.bank_statements 
      WHERE bank_statements.id = bank_statement_transactions.statement_id 
      AND (bank_statements.company_id = public.get_user_company_id(auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can create transactions for their company statements" 
  ON public.bank_statement_transactions FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.bank_statements 
      WHERE bank_statements.id = bank_statement_transactions.statement_id 
      AND (bank_statements.company_id = public.get_user_company_id(auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Finance users can update transactions" 
  ON public.bank_statement_transactions FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.bank_statements 
      WHERE bank_statements.id = bank_statement_transactions.statement_id 
      AND (public.has_finance_access(auth.uid()) OR bank_statements.uploaded_by = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Admins can delete transactions" 
  ON public.bank_statement_transactions FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.bank_statements 
      WHERE bank_statements.id = bank_statement_transactions.statement_id 
      AND (public.is_admin(auth.uid()) OR bank_statements.uploaded_by = auth.uid())
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_bank_statements_updated_at 
  BEFORE UPDATE ON public.bank_statements 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_statement_transactions_updated_at 
  BEFORE UPDATE ON public.bank_statement_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
