
-- =========================================================
-- Drop ALL existing policies
-- =========================================================

DROP POLICY IF EXISTS "Users view findings of own scans" ON public.findings;
DROP POLICY IF EXISTS "Plans are readable by everyone" ON public.plans;
DROP POLICY IF EXISTS "Users view own queue jobs" ON public.scan_queue;
DROP POLICY IF EXISTS "Users manage own sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users insert own scans" ON public.scans;
DROP POLICY IF EXISTS "Users update own scans" ON public.scans;
DROP POLICY IF EXISTS "Users view own scans" ON public.scans;
DROP POLICY IF EXISTS "Users manage own scheduled scans" ON public.scheduled_scans;
DROP POLICY IF EXISTS "Users view own subscription" ON public.subscriptions;

-- =========================================================
-- Recreate with TO authenticated
-- =========================================================

-- findings: SELECT via join to scans
CREATE POLICY "Authenticated view own findings"
  ON public.findings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.scans
    WHERE scans.id = findings.scan_id AND scans.user_id = auth.uid()
  ));

-- plans: authenticated read-only
CREATE POLICY "Authenticated read plans"
  ON public.plans FOR SELECT TO authenticated
  USING (true);

-- scan_queue: SELECT via join to scans
CREATE POLICY "Authenticated view own queue jobs"
  ON public.scan_queue FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.scans
    WHERE scans.id = scan_queue.scan_id AND scans.user_id = auth.uid()
  ));

-- scan_sessions: ALL for owner
CREATE POLICY "Authenticated manage own sessions"
  ON public.scan_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- scans: SELECT
CREATE POLICY "Authenticated view own scans"
  ON public.scans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- scans: INSERT with quota check
CREATE POLICY "Authenticated insert own scans"
  ON public.scans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND check_scan_quota(auth.uid()));

-- scans: UPDATE
CREATE POLICY "Authenticated update own scans"
  ON public.scans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- scheduled_scans: ALL for owner
CREATE POLICY "Authenticated manage own scheduled scans"
  ON public.scheduled_scans FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- subscriptions: SELECT for owner
CREATE POLICY "Authenticated view own subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- scanner_heartbeats: authenticated read-only
CREATE POLICY "Authenticated view heartbeats"
  ON public.scanner_heartbeats FOR SELECT TO authenticated
  USING (true);
