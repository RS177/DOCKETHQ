CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.waitlist_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT,
  practice_type TEXT,
  source TEXT DEFAULT 'landing',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS waitlist_leads_created_idx
  ON public.waitlist_leads(created_at DESC);

ALTER TABLE public.waitlist_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist leads are admin only" ON public.waitlist_leads;

CREATE POLICY "waitlist leads are admin only"
ON public.waitlist_leads
FOR ALL
USING (false)
WITH CHECK (false);
