-- Ensure realtime payload contains full rows for reliable client-side filtering
ALTER TABLE public.savings_deposits REPLICA IDENTITY FULL;
ALTER TABLE public.loan_disbursements REPLICA IDENTITY FULL;

-- Ensure tables are in realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication p
    JOIN pg_publication_rel pr ON pr.prpubid = p.oid
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'savings_deposits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_deposits;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication p
    JOIN pg_publication_rel pr ON pr.prpubid = p.oid
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'loan_disbursements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loan_disbursements;
  END IF;
END $$;