

# Fix findings severity constraint

The `findings` table has a CHECK constraint that doesn't include `'INFO'` as a valid severity. The worker is trying to insert findings with severity `'INFO'` and failing.

## Migration

Drop the old constraint and re-create it with `'INFO'` included:

```sql
ALTER TABLE findings DROP CONSTRAINT findings_severity_check;
ALTER TABLE findings ADD CONSTRAINT findings_severity_check 
  CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));
```

## Code update

Add `'INFO'` to the `SEVERITY_ORDER` array in `src/domain/scan.ts` so the UI can display INFO-level findings correctly.

