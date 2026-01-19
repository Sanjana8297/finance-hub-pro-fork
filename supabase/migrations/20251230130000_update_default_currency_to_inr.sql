-- Update default currency to INR for Indian companies
-- This will only affect new companies, existing companies keep their current currency

-- Update companies table default
ALTER TABLE public.companies 
ALTER COLUMN currency SET DEFAULT 'INR';

-- Update expenses table default (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'expenses' 
             AND column_name = 'currency') THEN
    ALTER TABLE public.expenses 
    ALTER COLUMN currency SET DEFAULT 'INR';
  END IF;
END $$;

-- Update invoices table default (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'invoices' 
             AND column_name = 'currency') THEN
    ALTER TABLE public.invoices 
    ALTER COLUMN currency SET DEFAULT 'INR';
  END IF;
END $$;

-- Update receipts table default (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'receipts' 
             AND column_name = 'currency') THEN
    ALTER TABLE public.receipts 
    ALTER COLUMN currency SET DEFAULT 'INR';
  END IF;
END $$;
