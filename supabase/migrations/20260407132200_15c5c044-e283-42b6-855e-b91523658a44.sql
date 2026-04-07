CREATE OR REPLACE FUNCTION public.complete_scan_job(
  p_job_id uuid,
  p_scan_id uuid,
  p_score integer,
  p_duration_ms integer,
  p_page_title text DEFAULT ''::text,
  p_findings jsonb DEFAULT '[]'::jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.scan_queue
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_job_id;

  UPDATE public.scans
  SET status = 'completed',
      score = LEAST(100, GREATEST(0, p_score)),
      scan_duration_ms = p_duration_ms,
      page_title = NULLIF(p_page_title, ''),
      completed_at = NOW(),
      metadata = p_metadata
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
$$;