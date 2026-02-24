-- Backfill employees from existing website users (profiles)
-- Inserts only users that are not already present in employees
INSERT INTO public.employees (
  user_id,
  company_id,
  full_name,
  email,
  phone,
  status
)
SELECT
  p.id AS user_id,
  p.company_id,
  COALESCE(
    NULLIF(TRIM(p.full_name), ''),
    NULLIF(TRIM((au.raw_user_meta_data ->> 'full_name')), ''),
    SPLIT_PART(COALESCE(NULLIF(TRIM(p.email), ''), au.email), '@', 1)
  ) AS full_name,
  COALESCE(NULLIF(TRIM(p.email), ''), au.email) AS email,
  p.phone,
  'active'::text AS status
FROM public.profiles p
LEFT JOIN auth.users au
  ON au.id = p.id
WHERE COALESCE(NULLIF(TRIM(p.email), ''), au.email) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.user_id = p.id
  );
