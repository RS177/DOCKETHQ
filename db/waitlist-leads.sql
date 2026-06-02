CREATE TABLE IF NOT EXISTS public.waitlist_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT,
  practice_type TEXT,
  source TEXT DEFAULT 'landing',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.waitlist_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist leads are admin only" ON public.waitlist_leads;

CREATE POLICY "waitlist leads are admin only"
ON public.waitlist_leads
FOR ALL
USING (false)
WITH CHECK (false);
