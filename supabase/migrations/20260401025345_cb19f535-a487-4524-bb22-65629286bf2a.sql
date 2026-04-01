-- Auto-enqueue: sempre que um scan é criado, inserir na scan_queue automaticamente
CREATE OR REPLACE FUNCTION public.auto_enqueue_scan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.scan_queue (scan_id, session_id, status, priority, attempts, max_attempts)
  VALUES (NEW.id, NEW.session_id, 'pending', 0, 0, 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_enqueue ON public.scans;
CREATE TRIGGER trg_auto_enqueue
  AFTER INSERT ON public.scans
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enqueue_scan();

-- Retroativamente enfileirar scans pendentes que ficaram sem job na queue
INSERT INTO public.scan_queue (scan_id, session_id, status, priority, attempts, max_attempts)
SELECT s.id, s.session_id, 'pending', 0, 0, 3
FROM public.scans s
LEFT JOIN public.scan_queue sq ON sq.scan_id = s.id
WHERE s.status = 'pending' AND sq.id IS NULL;