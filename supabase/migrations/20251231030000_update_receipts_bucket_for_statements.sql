-- Update receipts bucket to allow Excel files for bank statements
-- This migration updates the existing receipts bucket to support Excel files
UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/heic', 
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- .xlsx
    'application/vnd.ms-excel', -- .xls
    'text/csv', -- .csv
    'application/octet-stream' -- Fallback for Excel files
  ],
  file_size_limit = 20971520 -- 20MB (increased from 10MB)
WHERE id = 'receipts';
