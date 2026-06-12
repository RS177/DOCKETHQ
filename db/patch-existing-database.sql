-- Run this in Supabase SQL Editor if your existing database was created
-- before the newer DocketHQ schema. It keeps old data and adds the columns
-- the current app expects.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
    CREATE TYPE plan_type AS ENUM ('free', 'pro', 'enterprise');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_member_role') THEN
    CREATE TYPE firm_member_role AS ENUM ('owner', 'admin', 'lawyer', 'associate');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status') THEN
    CREATE TYPE case_status AS ENUM ('pending', 'disposed', 'dismissed', 'stayed', 'unknown');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM ('unverified', 'auto_synced', 'needs_review', 'verified', 'sync_failed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
    CREATE TYPE sync_status AS ENUM ('queued', 'running', 'success', 'no_change', 'changed', 'failed', 'captcha_blocked');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_source') THEN
    CREATE TYPE sync_source AS ENUM ('ecourts', 'manual_import');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_source') THEN
    CREATE TYPE event_source AS ENUM ('manual', 'ecourts', 'system', 'ai');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE event_type AS ENUM (
      'case_created',
      'case_updated',
      'status_changed',
      'hearing_added',
      'hearing_changed',
      'order_uploaded',
      'task_created',
      'task_completed',
      'note_added',
      'verification_changed',
      'sync_completed',
      'sync_failed',
      'client_notified',
      'payment_updated'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_status') THEN
    CREATE TYPE reminder_status AS ENUM ('scheduled', 'sent', 'cancelled', 'failed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
    CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'whatsapp');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
    CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed', 'cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS firms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  practice_type TEXT NOT NULL DEFAULT 'solo',
  plan_type plan_type NOT NULL DEFAULT 'free',
  court_focus TEXT,
  city TEXT,
  state TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  terms_version TEXT,
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE firms
  ADD COLUMN IF NOT EXISTS practice_type TEXT NOT NULL DEFAULT 'solo',
  ADD COLUMN IF NOT EXISTS court_focus TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS lawyer_count INTEGER,
  ADD COLUMN IF NOT EXISTS staff_count INTEGER,
  ADD COLUMN IF NOT EXISTS practice_areas TEXT,
  ADD COLUMN IF NOT EXISTS custom_workflow_notes TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dashboard_pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS dashboard_pin_salt TEXT,
  ADD COLUMN IF NOT EXISTS dashboard_pin_updated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'firms_practice_type_check'
  ) THEN
    ALTER TABLE firms
      ADD CONSTRAINT firms_practice_type_check
      CHECK (practice_type IN ('solo', 'firm'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS firm_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role firm_member_role NOT NULL DEFAULT 'associate',
  display_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (firm_id, user_id)
);

CREATE TABLE IF NOT EXISTS firm_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role firm_member_role NOT NULL DEFAULT 'lawyer',
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (firm_id, email)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'firm_invites_status_check'
  ) THEN
    ALTER TABLE firm_invites
      ADD CONSTRAINT firm_invites_status_check
      CHECK (status IN ('pending', 'accepted', 'cancelled'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION handle_new_user_firm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_firm_id UUID;
  requested_firm_name TEXT;
  requested_display_name TEXT;
  requested_practice_type TEXT;
BEGIN
  requested_practice_type := CASE
    WHEN NEW.raw_user_meta_data->>'practice_type' IN ('solo', 'firm')
      THEN NEW.raw_user_meta_data->>'practice_type'
    ELSE 'solo'
  END;

  requested_firm_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'firm_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    SPLIT_PART(NEW.email, '@', 1) || '''s firm'
  );

  requested_display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  INSERT INTO firms (name, practice_type, terms_version, terms_accepted_at)
  VALUES (
    requested_firm_name,
    requested_practice_type,
    NEW.raw_user_meta_data->>'terms_version',
    NULLIF(NEW.raw_user_meta_data->>'terms_accepted_at', '')::TIMESTAMPTZ
  )
  RETURNING id INTO new_firm_id;

  INSERT INTO firm_members (firm_id, user_id, role, display_name)
  VALUES (new_firm_id, NEW.id, 'owner', requested_display_name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_create_firm ON auth.users;

CREATE TRIGGER on_auth_user_created_create_firm
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user_firm();

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS status case_status NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS current_stage TEXT,
  ADD COLUMN IF NOT EXISTS next_hearing_date DATE,
  ADD COLUMN IF NOT EXISTS verification_status verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sync_status sync_status,
  ADD COLUMN IF NOT EXISTS judge_name TEXT,
  ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'case_title'
  ) THEN
    UPDATE cases
    SET title = COALESCE(title, case_title)
    WHERE title IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'current_status'
  ) THEN
    UPDATE cases
    SET status = (
      CASE
      WHEN LOWER(current_status) LIKE '%dismiss%' THEN 'dismissed'
      WHEN LOWER(current_status) LIKE '%disposed%' THEN 'disposed'
      WHEN LOWER(current_status) LIKE '%stay%' THEN 'stayed'
      WHEN LOWER(current_status) LIKE '%pending%' THEN 'pending'
      ELSE COALESCE(status::text, 'unknown')
      END
    )::case_status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'next_hearing'
  ) THEN
    UPDATE cases
    SET next_hearing_date = COALESCE(next_hearing_date, next_hearing::date)
    WHERE next_hearing IS NOT NULL
      AND next_hearing_date IS NULL
      AND next_hearing::text ~ '^\d{4}-\d{2}-\d{2}$';
  END IF;
END $$;

UPDATE cases
SET title = COALESCE(title, 'Untitled matter')
WHERE title IS NULL;

ALTER TABLE cases
  ALTER COLUMN title SET NOT NULL;

CREATE OR REPLACE FUNCTION enforce_case_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  firm_plan plan_type;
  current_case_count INTEGER;
  legacy_user_id TEXT;
BEGIN
  IF NEW.firm_id IS NOT NULL THEN
    SELECT plan_type INTO firm_plan
    FROM firms
    WHERE id = NEW.firm_id;

    IF COALESCE(firm_plan, 'free'::plan_type) = 'free'::plan_type THEN
      SELECT COUNT(*) INTO current_case_count
      FROM cases
      WHERE firm_id = NEW.firm_id
        AND tracking_enabled = TRUE;

      IF current_case_count >= 1 THEN
        RAISE EXCEPTION 'Free plan includes 1 tracked case. Upgrade to add another case.';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  legacy_user_id := to_jsonb(NEW)->>'user id';

  IF legacy_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO current_case_count
    FROM cases c
    WHERE to_jsonb(c)->>'user id' = legacy_user_id
      AND COALESCE((to_jsonb(c)->>'tracking_enabled')::BOOLEAN, TRUE) = TRUE;

    IF current_case_count >= 1 THEN
      RAISE EXCEPTION 'Free plan includes 1 tracked case. Upgrade to add another case.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_case_plan_limit_before_insert ON cases;

CREATE TRIGGER enforce_case_plan_limit_before_insert
BEFORE INSERT ON cases
FOR EACH ROW
EXECUTE FUNCTION enforce_case_plan_limit();

CREATE TABLE IF NOT EXISTS case_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source event_source NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  source sync_source NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  normalized_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload_hash TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, source, payload_hash)
);

CREATE TABLE IF NOT EXISTS case_sync_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  source sync_source NOT NULL DEFAULT 'ecourts',
  status sync_status NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_message TEXT,
  raw_snapshot_id UUID REFERENCES case_snapshots(id) ON DELETE SET NULL,
  detected_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS case_events_case_time_idx
  ON case_events(case_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS case_sync_runs_case_created_idx
  ON case_sync_runs(case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS case_hearings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  hearing_date DATE NOT NULL,
  purpose TEXT,
  outcome_notes TEXT,
  order_document_url TEXT,
  source event_source NOT NULL DEFAULT 'manual',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS case_hearings_case_date_idx
  ON case_hearings(case_id, hearing_date DESC);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  recipient_email TEXT,
  recipient_phone TEXT,
  status reminder_status NOT NULL DEFAULT 'scheduled',
  sent_at TIMESTAMPTZ,
  delivery_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_error TEXT;

CREATE INDEX IF NOT EXISTS reminders_case_time_idx
  ON reminders(case_id, remind_at);

CREATE INDEX IF NOT EXISTS reminders_status_time_idx
  ON reminders(status, remind_at);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  body TEXT,
  status notification_status NOT NULL DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_firm_created_idx
  ON notifications(firm_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waitlist_leads (
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
  ON waitlist_leads(created_at DESC);

ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_leads ENABLE ROW LEVEL SECURITY;

ALTER TABLE firms FORCE ROW LEVEL SECURITY;
ALTER TABLE firm_members FORCE ROW LEVEL SECURITY;
ALTER TABLE firm_invites FORCE ROW LEVEL SECURITY;
ALTER TABLE cases FORCE ROW LEVEL SECURITY;
ALTER TABLE case_events FORCE ROW LEVEL SECURITY;
ALTER TABLE case_snapshots FORCE ROW LEVEL SECURITY;
ALTER TABLE case_sync_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE case_hearings FORCE ROW LEVEL SECURITY;
ALTER TABLE reminders FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_firm_member(target_firm_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM firm_members
    WHERE firm_members.firm_id = target_firm_id
      AND firm_members.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION can_manage_firm(target_firm_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM firm_members
    WHERE firm_members.firm_id = target_firm_id
      AND firm_members.user_id = auth.uid()
      AND firm_members.role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION can_access_case(target_case cases)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    is_firm_member((target_case).firm_id)
    OR (
      (target_case).firm_id IS NULL
      AND to_jsonb(target_case)->>'user id' = auth.uid()::TEXT
    )
    OR (target_case).created_by = auth.uid();
$$;

DROP POLICY IF EXISTS "Members can view their firms" ON firms;
DROP POLICY IF EXISTS "Members can update their firms" ON firms;
DROP POLICY IF EXISTS "Members can view firm members" ON firm_members;
DROP POLICY IF EXISTS "Members can view firm invites" ON firm_invites;
DROP POLICY IF EXISTS "Members can manage firm invites" ON firm_invites;
DROP POLICY IF EXISTS "Members can view firm cases" ON cases;
DROP POLICY IF EXISTS "Members can manage firm cases" ON cases;
DROP POLICY IF EXISTS "Members can manage firm events" ON case_events;
DROP POLICY IF EXISTS "Members can manage firm snapshots" ON case_snapshots;
DROP POLICY IF EXISTS "Members can view firm snapshots" ON case_snapshots;
DROP POLICY IF EXISTS "Members can manage firm sync runs" ON case_sync_runs;
DROP POLICY IF EXISTS "Members can view firm sync runs" ON case_sync_runs;
DROP POLICY IF EXISTS "Members can manage firm hearings" ON case_hearings;
DROP POLICY IF EXISTS "Members can manage firm reminders" ON reminders;
DROP POLICY IF EXISTS "Members can view firm notifications" ON notifications;
DROP POLICY IF EXISTS "Members can view firm audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Members can insert firm audit logs" ON audit_logs;
DROP POLICY IF EXISTS "waitlist leads are admin only" ON waitlist_leads;

CREATE POLICY "Members can view their firms" ON firms
  FOR SELECT USING (is_firm_member(id));

CREATE POLICY "Members can update their firms" ON firms
  FOR UPDATE USING (can_manage_firm(id))
  WITH CHECK (can_manage_firm(id));

CREATE POLICY "Members can view firm members" ON firm_members
  FOR SELECT USING (is_firm_member(firm_id));

CREATE POLICY "Members can view firm invites" ON firm_invites
  FOR SELECT USING (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm invites" ON firm_invites
  FOR ALL USING (can_manage_firm(firm_id))
  WITH CHECK (can_manage_firm(firm_id));

CREATE POLICY "Members can view firm cases" ON cases
  FOR SELECT USING (can_access_case(cases));

CREATE POLICY "Members can manage firm cases" ON cases
  FOR ALL USING (can_access_case(cases))
  WITH CHECK (
    is_firm_member(firm_id)
    OR (
      firm_id IS NULL
      AND to_jsonb(cases)->>'user id' = auth.uid()::TEXT
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Members can manage firm events" ON case_events
  FOR ALL USING (is_firm_member(firm_id))
  WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm snapshots" ON case_snapshots
  FOR ALL USING (is_firm_member(firm_id))
  WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm sync runs" ON case_sync_runs
  FOR ALL USING (is_firm_member(firm_id))
  WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm hearings" ON case_hearings
  FOR ALL USING (is_firm_member(firm_id))
  WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm reminders" ON reminders
  FOR ALL USING (firm_id IS NULL OR is_firm_member(firm_id))
  WITH CHECK (firm_id IS NULL OR is_firm_member(firm_id));

CREATE POLICY "Members can view firm notifications" ON notifications
  FOR SELECT USING (is_firm_member(firm_id));

CREATE POLICY "Members can view firm audit logs" ON audit_logs
  FOR SELECT USING (is_firm_member(firm_id));

CREATE POLICY "Members can insert firm audit logs" ON audit_logs
  FOR INSERT WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "waitlist leads are admin only" ON waitlist_leads
  FOR ALL USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION log_case_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_firm_id UUID;
  audit_case_id UUID;
  audit_title TEXT;
  audit_status TEXT;
  audit_hearing_date TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    audit_firm_id := OLD.firm_id;
    audit_case_id := OLD.id;
    audit_title := OLD.title;
    audit_status := OLD.status::TEXT;
    audit_hearing_date := OLD.next_hearing_date::TEXT;
  ELSE
    audit_firm_id := NEW.firm_id;
    audit_case_id := NEW.id;
    audit_title := NEW.title;
    audit_status := NEW.status::TEXT;
    audit_hearing_date := NEW.next_hearing_date::TEXT;
  END IF;

  IF audit_firm_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;

    RETURN NEW;
  END IF;

  INSERT INTO audit_logs (
    firm_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    audit_firm_id,
    auth.uid(),
    LOWER(TG_OP),
    'case',
    audit_case_id,
    jsonb_build_object(
      'title', audit_title,
      'status', audit_status,
      'next_hearing_date', audit_hearing_date
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cases_audit_log_after_change ON cases;

CREATE TRIGGER cases_audit_log_after_change
AFTER INSERT OR UPDATE OR DELETE ON cases
FOR EACH ROW
EXECUTE FUNCTION log_case_audit();
