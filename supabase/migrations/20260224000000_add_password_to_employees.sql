-- Add password column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS password TEXT NULL;
