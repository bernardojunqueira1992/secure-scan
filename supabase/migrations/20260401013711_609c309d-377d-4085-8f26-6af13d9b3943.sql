
-- Enable pgcrypto for cookie encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Timestamp updater function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  scans_per_month INTEGER NOT NULL,
  max_urls INTEGER NOT NULL,
  api_access BOOLEAN NOT NULL DEFAULT FALSE,
  price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are readable by everyone" ON public.plans FOR SELECT USING (true);

-- Seed default plans
INSERT INTO public.plans (name, scans_per_month, max_urls, api_access, price_cents) VALUES
  ('free', 50, 3, false, 0),
  ('pro', 500, 10, true, 1900),
  ('team', 2000, 999, true, 4900);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')) DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status) WHERE status = 'active';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scan Sessions table (for authenticated scanning)
CREATE TABLE public.scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url_pattern TEXT NOT NULL,
  cookies_encrypted TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_session_name_per_user UNIQUE(user_id, name)
);

CREATE INDEX idx_scan_sessions_user ON public.scan_sessions(user_id);
CREATE INDEX idx_scan_sessions_expiry ON public.scan_sessions(expires_at);

ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.scan_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_scan_sessions_updated_at
  BEFORE UPDATE ON public.scan_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scans table
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  scan_duration_ms INTEGER,
  page_title TEXT,
  screenshot_url TEXT,
  error_message TEXT,
  session_id UUID REFERENCES public.scan_sessions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_scans_user_date ON public.scans(user_id, created_at DESC);
CREATE INDEX idx_scans_url ON public.scans(url);
CREATE INDEX idx_scans_status ON public.scans(status) WHERE status IN ('pending', 'running');

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own scans" ON public.scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scans" ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own scans" ON public.scans FOR UPDATE USING (auth.uid() = user_id);

-- Findings table
CREATE TABLE public.findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  remediation TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_findings_scan ON public.findings(scan_id);
CREATE INDEX idx_findings_severity ON public.findings(severity);

ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view findings of own scans" ON public.findings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.scans WHERE scans.id = findings.scan_id AND scans.user_id = auth.uid()));

-- Scan Queue table
CREATE TABLE public.scan_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.scan_sessions(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_queue_pending ON public.scan_queue(priority DESC, created_at ASC) WHERE status = 'pending';
CREATE INDEX idx_queue_processing ON public.scan_queue(started_at) WHERE status = 'processing';

ALTER TABLE public.scan_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own queue jobs" ON public.scan_queue FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.scans WHERE scans.id = scan_queue.scan_id AND scans.user_id = auth.uid()));

-- Scheduled Scans table (Phase 2)
CREATE TABLE public.scheduled_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  session_id UUID REFERENCES public.scan_sessions(id),
  cron_schedule TEXT NOT NULL,
  alert_threshold INTEGER,
  notification_email TEXT,
  notification_slack_webhook TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduled_scans_user ON public.scheduled_scans(user_id);
CREATE INDEX idx_scheduled_scans_next_run ON public.scheduled_scans(next_run_at) WHERE is_active = TRUE;

ALTER TABLE public.scheduled_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scheduled scans" ON public.scheduled_scans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_scheduled_scans_updated_at
  BEFORE UPDATE ON public.scheduled_scans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function: Check scan quota
CREATE OR REPLACE FUNCTION public.check_scan_quota(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  plan_limit INTEGER;
  scans_this_month INTEGER;
BEGIN
  SELECT p.scans_per_month INTO plan_limit
  FROM public.subscriptions s
  JOIN public.plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id AND s.status = 'active'
  ORDER BY s.created_at DESC LIMIT 1;

  IF plan_limit IS NULL THEN plan_limit := 50; END IF;

  SELECT COUNT(*) INTO scans_this_month
  FROM public.scans
  WHERE user_id = p_user_id AND created_at >= date_trunc('month', NOW());

  RETURN scans_this_month < plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Dequeue next scan job (atomic)
CREATE OR REPLACE FUNCTION public.dequeue_scan_job()
RETURNS TABLE (job_id UUID, scan_id UUID, session_id UUID, url TEXT) AS $$
DECLARE
  job_record RECORD;
BEGIN
  SELECT sq.id, sq.scan_id, sq.session_id, s.url
  INTO job_record
  FROM public.scan_queue sq
  JOIN public.scans s ON sq.scan_id = s.id
  WHERE sq.status = 'pending' AND sq.attempts < sq.max_attempts
  ORDER BY sq.priority DESC, sq.created_at ASC
  LIMIT 1
  FOR UPDATE OF sq SKIP LOCKED;

  IF job_record IS NULL THEN RETURN; END IF;

  UPDATE public.scan_queue
  SET status = 'processing', started_at = NOW(), attempts = attempts + 1
  WHERE id = job_record.id;

  UPDATE public.scans SET status = 'running' WHERE id = job_record.scan_id;

  RETURN QUERY SELECT job_record.id, job_record.scan_id, job_record.session_id, job_record.url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Notify scanner on new job
CREATE OR REPLACE FUNCTION public.notify_new_job()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('new_scan_job', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER on_scan_queued
  AFTER INSERT ON public.scan_queue
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_new_job();
