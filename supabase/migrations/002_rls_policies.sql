-- ============================================================
-- 002_rls_policies.sql
-- showMe.music CRM — Row Level Security policies
-- ============================================================

-- Helper: shorthand for the authenticated user's UUID
-- (wraps auth.uid() for readability across all policies)
CREATE OR REPLACE FUNCTION auth_uid()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT auth.uid()
$$;

-- ============================================================
-- ICP PROFILES
-- ============================================================

ALTER TABLE icp_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "icp_profiles: users can select their own"
  ON icp_profiles FOR SELECT
  USING (user_id = auth_uid());

CREATE POLICY "icp_profiles: users can insert their own"
  ON icp_profiles FOR INSERT
  WITH CHECK (user_id = auth_uid());

CREATE POLICY "icp_profiles: users can update their own"
  ON icp_profiles FOR UPDATE
  USING (user_id = auth_uid())
  WITH CHECK (user_id = auth_uid());

CREATE POLICY "icp_profiles: users can delete their own"
  ON icp_profiles FOR DELETE
  USING (user_id = auth_uid());

-- ============================================================
-- LEADS
-- ============================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads: users can select their own"
  ON leads FOR SELECT
  USING (user_id = auth_uid());

CREATE POLICY "leads: users can insert their own"
  ON leads FOR INSERT
  WITH CHECK (user_id = auth_uid());

CREATE POLICY "leads: users can update their own"
  ON leads FOR UPDATE
  USING (user_id = auth_uid())
  WITH CHECK (user_id = auth_uid());

CREATE POLICY "leads: users can delete their own"
  ON leads FOR DELETE
  USING (user_id = auth_uid());

-- ============================================================
-- CONTACTS
-- ============================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts: users can select their own"
  ON contacts FOR SELECT
  USING (user_id = auth_uid());

CREATE POLICY "contacts: users can insert their own"
  ON contacts FOR INSERT
  WITH CHECK (user_id = auth_uid());

CREATE POLICY "contacts: users can update their own"
  ON contacts FOR UPDATE
  USING (user_id = auth_uid())
  WITH CHECK (user_id = auth_uid());

CREATE POLICY "contacts: users can delete their own"
  ON contacts FOR DELETE
  USING (user_id = auth_uid());

-- ============================================================
-- EMAIL DRAFTS
-- ============================================================

ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_drafts: users can select their own"
  ON email_drafts FOR SELECT
  USING (user_id = auth_uid());

CREATE POLICY "email_drafts: users can insert their own"
  ON email_drafts FOR INSERT
  WITH CHECK (user_id = auth_uid());

CREATE POLICY "email_drafts: users can update their own"
  ON email_drafts FOR UPDATE
  USING (user_id = auth_uid())
  WITH CHECK (user_id = auth_uid());

CREATE POLICY "email_drafts: users can delete their own"
  ON email_drafts FOR DELETE
  USING (user_id = auth_uid());

-- ============================================================
-- LEAD ACTIVITIES
-- Activities are append-only audit records.
-- Users may SELECT and INSERT their own activities,
-- but UPDATE and DELETE are intentionally not permitted.
-- ============================================================

ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_activities: users can select their own"
  ON lead_activities FOR SELECT
  USING (user_id = auth_uid());

CREATE POLICY "lead_activities: users can insert their own"
  ON lead_activities FOR INSERT
  WITH CHECK (user_id = auth_uid());

-- No UPDATE policy — activities are immutable.
-- No DELETE policy — activities are immutable.

-- ============================================================
-- CLICKUP CONFIGS
-- ============================================================

ALTER TABLE clickup_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clickup_configs: users can select their own"
  ON clickup_configs FOR SELECT
  USING (user_id = auth_uid());

CREATE POLICY "clickup_configs: users can insert their own"
  ON clickup_configs FOR INSERT
  WITH CHECK (user_id = auth_uid());

CREATE POLICY "clickup_configs: users can update their own"
  ON clickup_configs FOR UPDATE
  USING (user_id = auth_uid())
  WITH CHECK (user_id = auth_uid());

CREATE POLICY "clickup_configs: users can delete their own"
  ON clickup_configs FOR DELETE
  USING (user_id = auth_uid());
