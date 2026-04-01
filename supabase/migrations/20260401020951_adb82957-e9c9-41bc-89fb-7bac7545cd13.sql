-- =============================================
-- SecureScan: Migration Complementar (Worker Infrastructure)
-- =============================================

-- 1. Adicionar colunas na scan_queue para heartbeat e retry
ALTER TABLE public.scan_queue
ADD COLUMN IF NOT EXISTS heartbeat_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS retry_after TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_queue_stuck
ON public.scan_queue(heartbeat_at)
WHERE status = 'processing';

-- 2. Adicionar content_hash na findings para idempotência
ALTER TABLE public.findings
ADD COLUMN IF NOT EXISTS content_hash TEXT
GENERATED ALWAYS AS (md5(scan_id::text || type || coalesce(location, ''))) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS idx_findings_idempotent
ON public.findings(scan_id, content_hash);

-- 3. Criar tabela scanner_heartbeats (health tracking do worker)
CREATE TABLE IF NOT EXISTS public.scanner_heartbeats (
  id TEXT PRIMARY KEY DEFAULT 'main',
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  browser_pool_size INTEGER DEFAULT 0,
  active_scans INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('healthy', 'degraded', 'offline')) DEFAULT 'healthy'
);

ALTER TABLE public.scanner_heartbeats ENABLE ROW LEVEL SECURITY;

INSERT INTO public.scanner_heartbeats (id) VALUES ('main') ON CONFLICT DO NOTHING;

-- 4. Atualizar dequeue_scan_job para respeitar retry_after
CREATE OR REPLACE FUNCTION public.dequeue_scan_job()
RETURNS TABLE (job_id UUID, scan_id UUID, session_id UUID, url TEXT) AS $$
DECLARE
  job_record RECORD;
BEGIN
  SELECT sq.id, sq.scan_id, sq.session_id, s.url
  INTO job_record
  FROM public.scan_queue sq
  JOIN public.scans s ON sq.scan_id = s.id
  WHERE sq.status = 'pending'
    AND sq.attempts < sq.max_attempts
    AND (sq.retry_after IS NULL OR sq.retry_after <= NOW())
  ORDER BY sq.priority DESC, sq.created_at ASC
  LIMIT 1
  FOR UPDATE OF sq SKIP LOCKED;

  IF job_record IS NULL THEN RETURN; END IF;

  UPDATE public.scan_queue
  SET status = 'processing',
      started_at = NOW(),
      heartbeat_at = NOW(),
      attempts = attempts + 1
  WHERE id = job_record.id;

  UPDATE public.scans SET status = 'running' WHERE id = job_record.scan_id;

  RETURN QUERY SELECT job_record.id, job_record.scan_id, job_record.session_id, job_record.url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. RPC: Completar scan de forma transacional
CREATE OR REPLACE FUNCTION public.complete_scan_job(
  p_job_id UUID,
  p_scan_id UUID,
  p_score INTEGER,
  p_duration_ms INTEGER,
  p_findings JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE public.scan_queue
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_job_id;

  UPDATE public.scans
  SET status = 'completed',
      score = LEAST(100, GREATEST(0, p_score)),
      scan_duration_ms = p_duration_ms,
      completed_at = NOW()
  WHERE id = p_scan_id;

  INSERT INTO public.findings (scan_id, type, severity, title, description, location, remediation, metadata)
  SELECT
    p_scan_id,
    (f->>'type'),
    (f->>'severity'),
    (f->>'title'),
    (f->>'description'),
    (f->>'location'),
    (f->>'remediation'),
    COALESCE((f->'metadata')::jsonb, '{}')
  FROM jsonb_array_elements(p_findings) AS f
  ON CONFLICT (scan_id, content_hash) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. RPC: Falhar scan com retry automático e backoff
CREATE OR REPLACE FUNCTION public.fail_scan_job(
  p_job_id UUID,
  p_scan_id UUID,
  p_error TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_attempts INTEGER;
  v_max INTEGER;
  v_backoff INTERVAL;
BEGIN
  SELECT attempts, max_attempts INTO v_attempts, v_max
  FROM public.scan_queue WHERE id = p_job_id;

  IF v_attempts < v_max THEN
    v_backoff := (power(2, v_attempts) * 10) * INTERVAL '1 second';
    UPDATE public.scan_queue
    SET status = 'pending',
        retry_after = NOW() + v_backoff,
        error_message = p_error,
        started_at = NULL,
        heartbeat_at = NULL
    WHERE id = p_job_id;
    UPDATE public.scans SET status = 'pending' WHERE id = p_scan_id;
    RETURN TRUE;
  ELSE
    UPDATE public.scan_queue
    SET status = 'failed',
        completed_at = NOW(),
        error_message = 'Failed after ' || v_max || ' attempts: ' || p_error
    WHERE id = p_job_id;
    UPDATE public.scans
    SET status = 'failed',
        error_message = p_error
    WHERE id = p_scan_id;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. RPC: Reaper de jobs travados
CREATE OR REPLACE FUNCTION public.reap_stuck_jobs()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH stuck AS (
    UPDATE public.scan_queue
    SET status = 'pending',
        started_at = NULL,
        heartbeat_at = NULL,
        retry_after = NOW() + INTERVAL '30 seconds',
        error_message = 'Job stuck — no heartbeat for 2+ minutes'
    WHERE status = 'processing'
      AND heartbeat_at < NOW() - INTERVAL '2 minutes'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM stuck;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. RPC: Scanner heartbeat
CREATE OR REPLACE FUNCTION public.scanner_heartbeat(
  p_scanner_id TEXT,
  p_pool_size INTEGER,
  p_active INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.scanner_heartbeats (id, last_seen_at, browser_pool_size, active_scans, status)
  VALUES (
    p_scanner_id,
    NOW(),
    p_pool_size,
    p_active,
    CASE WHEN p_pool_size > 0 THEN 'healthy' ELSE 'degraded' END
  )
  ON CONFLICT (id) DO UPDATE SET
    last_seen_at = NOW(),
    browser_pool_size = EXCLUDED.browser_pool_size,
    active_scans = EXCLUDED.active_scans,
    status = EXCLUDED.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Adicionar quota check na policy INSERT de scans
DROP POLICY IF EXISTS "Users insert own scans" ON public.scans;
CREATE POLICY "Users insert own scans" ON public.scans
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.check_scan_quota(auth.uid())
  );

-- 10. Habilitar Realtime na tabela scans
ALTER PUBLICATION supabase_realtime ADD TABLE public.scans;