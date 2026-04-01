

# Worker Infrastructure Migration + Dashboard Realtime

## 1. Database Migration
Run a single migration with the exact SQL provided:
- Add `heartbeat_at` and `retry_after` columns to `scan_queue`
- Add `content_hash` generated column to `findings` with unique index for idempotency
- Create `scanner_heartbeats` table (RLS enabled, no policies = service_role only)
- Replace `dequeue_scan_job()` to respect `retry_after`
- Create RPCs: `complete_scan_job`, `fail_scan_job`, `reap_stuck_jobs`, `scanner_heartbeat`
- Update scans INSERT policy to include quota check
- Enable Realtime on `scans` table

## 2. Dashboard Realtime Update
In `src/pages/Dashboard.tsx`:
- Remove `refetchInterval: 5000` from the `recentScans` useQuery
- Add `useEffect` with Supabase Realtime subscription on `scans` table changes → calls `refetchScans()`
- Add `useEffect` import
- Cleanup channel on unmount

## Files Changed
- `supabase/migrations/[timestamp].sql` — new migration (exact SQL from prompt)
- `src/pages/Dashboard.tsx` — swap polling for realtime subscription

