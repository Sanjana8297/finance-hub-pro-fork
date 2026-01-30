-- Add proof column to bank_statement_transactions table
ALTER TABLE public.bank_statement_transactions
ADD COLUMN IF NOT EXISTS proof TEXT NULL;

-- Create storage bucket for transaction proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transaction_proofs',
  'transaction_proofs',
  false, -- Private bucket
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users with finance access to upload transaction proofs
CREATE POLICY "Finance users can upload transaction proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'transaction_proofs' 
  AND auth.uid() IS NOT NULL
  AND (
    public.is_admin(auth.uid())
    OR public.has_finance_access(auth.uid())
  )
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow finance users to view transaction proofs
CREATE POLICY "Finance users can view transaction proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'transaction_proofs' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_finance_access(auth.uid())
    OR public.is_admin(auth.uid())
  )
);

-- Allow finance users to update transaction proofs
CREATE POLICY "Finance users can update transaction proofs"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'transaction_proofs' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_finance_access(auth.uid())
    OR public.is_admin(auth.uid())
  )
);

-- Allow admins to delete transaction proofs
CREATE POLICY "Admins can delete transaction proofs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'transaction_proofs' 
  AND public.is_admin(auth.uid())
);
