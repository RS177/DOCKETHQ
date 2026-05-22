CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dockethq litigation workflow schema.
-- Design principle: keep the latest case state on cases, and store every
-- meaningful legal/workflow movement in append-only event/sync tables.

CREATE TYPE plan_type AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE firm_member_role AS ENUM ('owner', 'admin', 'lawyer', 'associate');
CREATE TYPE client_type AS ENUM ('individual', 'corporate');
CREATE TYPE case_status AS ENUM ('pending', 'disposed', 'dismissed', 'stayed', 'unknown');
CREATE TYPE case_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE verification_status AS ENUM ('unverified', 'auto_synced', 'needs_review', 'verified', 'sync_failed');
CREATE TYPE event_source AS ENUM ('manual', 'ecourts', 'system', 'ai');
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
CREATE TYPE sync_source AS ENUM ('ecourts', 'manual_import');
CREATE TYPE sync_status AS ENUM ('queued', 'running', 'success', 'no_change', 'changed', 'failed', 'captcha_blocked');
CREATE TYPE task_status AS ENUM ('open', 'in_progress', 'done', 'cancelled');
CREATE TYPE reminder_status AS ENUM ('scheduled', 'sent', 'cancelled', 'failed');
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'whatsapp');
CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('quoted', 'part_paid', 'paid', 'overdue', 'waived');

CREATE TABLE firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    practice_type TEXT NOT NULL DEFAULT 'solo' CHECK (practice_type IN ('solo', 'firm')),
    plan_type plan_type NOT NULL DEFAULT 'free',
    court_focus TEXT,
    city TEXT,
    state TEXT,
    onboarding_completed_at TIMESTAMPTZ,
    terms_version TEXT,
    terms_accepted_at TIMESTAMPTZ,
    dashboard_pin_hash TEXT,
    dashboard_pin_salt TEXT,
    dashboard_pin_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE firm_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role firm_member_role NOT NULL DEFAULT 'associate',
    display_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (firm_id, user_id)
);

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

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    type client_type NOT NULL DEFAULT 'individual',
    primary_contact_name TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    cnr_number TEXT,
    title TEXT NOT NULL,
    court_name TEXT,
    court_complex TEXT,
    judge_name TEXT,
    case_type TEXT,
    filing_number TEXT,
    registration_number TEXT,
    filing_date DATE,
    current_stage TEXT,
    status case_status NOT NULL DEFAULT 'unknown',
    priority case_priority NOT NULL DEFAULT 'normal',
    next_hearing_date DATE,
    assigned_lawyer_id UUID REFERENCES firm_members(id) ON DELETE SET NULL,
    assigned_associate_id UUID REFERENCES firm_members(id) ON DELETE SET NULL,
    tracking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status verification_status NOT NULL DEFAULT 'unverified',
    last_synced_at TIMESTAMPTZ,
    last_sync_status sync_status,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (firm_id, cnr_number)
);

CREATE INDEX cases_firm_next_hearing_idx ON cases(firm_id, next_hearing_date) WHERE next_hearing_date IS NOT NULL;
CREATE INDEX cases_firm_status_idx ON cases(firm_id, status);
CREATE INDEX cases_cnr_idx ON cases(cnr_number);

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

CREATE TRIGGER enforce_case_plan_limit_before_insert
BEFORE INSERT ON cases
FOR EACH ROW
EXECUTE FUNCTION enforce_case_plan_limit();

CREATE TABLE case_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    party_type TEXT,
    side TEXT,
    advocate_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE case_hearings (
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

CREATE TABLE case_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    order_date DATE,
    title TEXT NOT NULL,
    summary TEXT,
    document_url TEXT,
    source event_source NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE case_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    document_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE case_events (
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

CREATE INDEX case_events_case_time_idx ON case_events(case_id, occurred_at DESC);

CREATE TABLE case_snapshots (
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

CREATE TABLE case_sync_runs (
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

CREATE INDEX case_sync_runs_case_created_idx ON case_sync_runs(case_id, created_at DESC);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES firm_members(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status task_status NOT NULL DEFAULT 'open',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tasks_firm_due_idx ON tasks(firm_id, due_date) WHERE due_date IS NOT NULL;

CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    remind_at TIMESTAMPTZ NOT NULL,
    channel notification_channel NOT NULL DEFAULT 'in_app',
    status reminder_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
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

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'quoted',
    due_date DATE,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE firms FORCE ROW LEVEL SECURITY;
ALTER TABLE firm_members FORCE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
ALTER TABLE cases FORCE ROW LEVEL SECURITY;
ALTER TABLE case_parties FORCE ROW LEVEL SECURITY;
ALTER TABLE case_hearings FORCE ROW LEVEL SECURITY;
ALTER TABLE case_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE case_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE case_events FORCE ROW LEVEL SECURITY;
ALTER TABLE case_snapshots FORCE ROW LEVEL SECURITY;
ALTER TABLE case_sync_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE reminders FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
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

CREATE OR REPLACE FUNCTION can_access_case(target_case cases)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT
        is_firm_member(target_case.firm_id)
        OR (
            target_case.firm_id IS NULL
            AND to_jsonb(target_case)->>'user id' = auth.uid()::TEXT
        )
        OR target_case.created_by = auth.uid();
$$;

CREATE POLICY "Members can view their firms" ON firms
    FOR SELECT USING (is_firm_member(id));

CREATE POLICY "Members can update their firms" ON firms
    FOR UPDATE USING (is_firm_member(id))
    WITH CHECK (is_firm_member(id));

CREATE POLICY "Members can view firm members" ON firm_members
    FOR SELECT USING (is_firm_member(firm_id));

CREATE POLICY "Members can view firm clients" ON clients
    FOR SELECT USING (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm clients" ON clients
    FOR ALL USING (is_firm_member(firm_id))
    WITH CHECK (is_firm_member(firm_id));

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

CREATE POLICY "Members can manage firm case parties" ON case_parties
    FOR ALL USING (is_firm_member(firm_id))
    WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm hearings" ON case_hearings
    FOR ALL USING (is_firm_member(firm_id))
    WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm orders" ON case_orders
    FOR ALL USING (is_firm_member(firm_id))
    WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm documents" ON case_documents
    FOR ALL USING (is_firm_member(firm_id))
    WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm events" ON case_events
    FOR ALL USING (is_firm_member(firm_id))
    WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm snapshots" ON case_snapshots
    FOR ALL USING (is_firm_member(firm_id))
    WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm sync runs" ON case_sync_runs
    FOR ALL USING (is_firm_member(firm_id))
    WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm tasks" ON tasks
    FOR ALL USING (is_firm_member(firm_id))
    WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm reminders" ON reminders
    FOR ALL USING (is_firm_member(firm_id))
    WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can view firm notifications" ON notifications
    FOR SELECT USING (is_firm_member(firm_id));

CREATE POLICY "Members can manage firm payments" ON payments
    FOR ALL USING (is_firm_member(firm_id))
    WITH CHECK (is_firm_member(firm_id));

CREATE POLICY "Members can view firm audit logs" ON audit_logs
    FOR SELECT USING (is_firm_member(firm_id));

CREATE POLICY "Members can insert firm audit logs" ON audit_logs
    FOR INSERT WITH CHECK (is_firm_member(firm_id));

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

CREATE TRIGGER cases_audit_log_after_change
AFTER INSERT OR UPDATE OR DELETE ON cases
FOR EACH ROW
EXECUTE FUNCTION log_case_audit();
