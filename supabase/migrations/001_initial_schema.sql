-- ============================================================
-- 001_initial_schema.sql
-- showMe.music CRM — Initial database schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE lead_type AS ENUM ('venue', 'promoter');

CREATE TYPE lead_status AS ENUM (
  'new',
  'researched',
  'contacted',
  'replied',
  'qualified',
  'closed'
);

CREATE TYPE activity_type AS ENUM (
  'status_changed',
  'contact_added',
  'email_generated',
  'email_sent',
  'note_added',
  'enrichment_run',
  'lead_created',
  'lead_discovered',
  'clickup_synced'
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ICP PROFILES
-- ============================================================

CREATE TABLE icp_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  lead_types      TEXT[]    NOT NULL DEFAULT '{}',
  min_capacity    INTEGER,
  max_capacity    INTEGER,
  venue_types     TEXT[]    NOT NULL DEFAULT '{}',
  promoter_scales TEXT[]    NOT NULL DEFAULT '{}',
  genres          TEXT[]    NOT NULL DEFAULT '{}',
  geographies     TEXT[]    NOT NULL DEFAULT '{}',
  keywords        TEXT[]    NOT NULL DEFAULT '{}',
  notes           TEXT,
  is_active       BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_icp_profiles_user_id ON icp_profiles (user_id);

CREATE TRIGGER trg_icp_profiles_updated_at
  BEFORE UPDATE ON icp_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- LEADS
-- ============================================================

CREATE TABLE leads (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  lead_type           lead_type NOT NULL,
  status              lead_status NOT NULL DEFAULT 'new',
  city                TEXT,
  state_province      TEXT,
  country             TEXT NOT NULL DEFAULT 'US',
  website             TEXT,
  domain              TEXT,
  instagram           TEXT,
  facebook            TEXT,
  capacity            INTEGER,
  venue_type          TEXT,
  promoter_scale      TEXT,
  ai_summary          TEXT,
  icp_score           INTEGER CHECK (icp_score >= 0 AND icp_score <= 100),
  notes               TEXT,
  tags                TEXT[]      NOT NULL DEFAULT '{}',
  source              TEXT        NOT NULL DEFAULT 'manual',
  enriched_at         TIMESTAMPTZ,
  ai_researched_at    TIMESTAMPTZ,
  clickup_task_id     TEXT,
  clickup_synced_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_user_id        ON leads (user_id);
CREATE INDEX idx_leads_status         ON leads (status);
CREATE INDEX idx_leads_created_at     ON leads (user_id, created_at DESC);
CREATE INDEX idx_leads_name_trgm      ON leads USING GIN (name gin_trgm_ops);
CREATE INDEX idx_leads_domain         ON leads (domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_leads_clickup_task   ON leads (clickup_task_id) WHERE clickup_task_id IS NOT NULL;

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CONTACTS
-- ============================================================

CREATE TABLE contacts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id          UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name       TEXT,
  last_name        TEXT,
  full_name        TEXT,
  title            TEXT,
  email            TEXT,
  email_source     TEXT,
  email_confidence INTEGER CHECK (email_confidence >= 0 AND email_confidence <= 100),
  phone            TEXT,
  phone_source     TEXT,
  linkedin         TEXT,
  is_primary       BOOLEAN NOT NULL DEFAULT FALSE,
  enriched_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_lead_id ON contacts (lead_id);
CREATE INDEX idx_contacts_user_id ON contacts (user_id);
CREATE INDEX idx_contacts_email   ON contacts (email) WHERE email IS NOT NULL;

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- EMAIL DRAFTS
-- ============================================================

CREATE TABLE email_drafts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id    UUID REFERENCES contacts(id) ON DELETE SET NULL,
  subject       TEXT NOT NULL,
  body          TEXT NOT NULL,
  model_used    TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  research_used TEXT,
  version       INTEGER NOT NULL DEFAULT 1,
  is_sent       BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_drafts_lead_id ON email_drafts (lead_id);
CREATE INDEX idx_email_drafts_user_id ON email_drafts (user_id);

CREATE TRIGGER trg_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- LEAD ACTIVITIES
-- ============================================================

CREATE TABLE lead_activities (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_activities_lead_id    ON lead_activities (lead_id, created_at DESC);
CREATE INDEX idx_lead_activities_user_id    ON lead_activities (user_id);
CREATE INDEX idx_lead_activities_type       ON lead_activities (activity_type);

-- No updated_at on lead_activities — activities are immutable records.

-- ============================================================
-- CLICKUP CONFIGS
-- ============================================================

CREATE TABLE clickup_configs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_token      TEXT NOT NULL,
  list_id        TEXT NOT NULL,
  status_mapping JSONB NOT NULL DEFAULT '{}',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_clickup_configs_user UNIQUE (user_id)
);

CREATE INDEX idx_clickup_configs_user_id ON clickup_configs (user_id);

CREATE TRIGGER trg_clickup_configs_updated_at
  BEFORE UPDATE ON clickup_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
