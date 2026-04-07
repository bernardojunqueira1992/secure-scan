

# Correções na Migration do Worker

O SQL do worker tem **3 erros** que precisam ser corrigidos antes de aplicar:

## Problemas encontrados

| # | Problema | Worker escreveu | Correto (banco atual) |
|---|----------|----------------|----------------------|
| 1 | Nome da tabela de jobs | `scan_jobs` | `scan_queue` |
| 2 | Coluna duração | `duration_ms` | `scan_duration_ms` |
| 3 | Falta `ON CONFLICT` nos findings | Sem tratamento | `ON CONFLICT (scan_id, content_hash) DO NOTHING` |
| 4 | Falta `search_path` | Não definido | `SET search_path TO 'public'` |
| 5 | Falta `LEAST/GREATEST` no score | `score = p_score` | `score = LEAST(100, GREATEST(0, p_score))` |
| 6 | Falta `NULLIF` no page_title | `page_title = p_page_title` | `page_title = NULLIF(p_page_title, '')` |
| 7 | Falta `COALESCE` no metadata dos findings | `(f->'metadata')::jsonb` | `COALESCE((f->'metadata')::jsonb, '{}')` |

## O que fazer

**Mande este SQL corrigido para o worker** — não precisa mudar nada no Lovable, só a migration que o worker aplica:

```sql
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
```

A migration deve ser aplicada **aqui no Lovable** (não no worker), pois é onde o banco vive. Após aprovação, aplico via migration tool.

O worker só precisa **chamar** a função com o novo parâmetro `p_metadata`.

