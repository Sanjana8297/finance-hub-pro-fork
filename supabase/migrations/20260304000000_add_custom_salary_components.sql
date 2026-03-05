-- Add custom_salary_components column to employee_details table
-- This column stores custom salary components added via the "Others" button

ALTER TABLE public.employee_details
ADD COLUMN IF NOT EXISTS custom_salary_components JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.employee_details.custom_salary_components IS 'Array of custom salary components with id, label, and monthly amount';
