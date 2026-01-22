-- Quick fix: Update receipts bucket to allow Excel files
-- Run this in Supabase SQL Editor to fix the 400 Bad Request error

-- Update bucket to allow Excel MIME types
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
    'application/octet-stream' -- Fallback
  ],
  file_size_limit = 20971520 -- 20MB
WHERE id = 'receipts';

-- Verify the update
SELECT id, name, allowed_mime_types, file_size_limit 
FROM storage.buckets 
WHERE id = 'receipts';
