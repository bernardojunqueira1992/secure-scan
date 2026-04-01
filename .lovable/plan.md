

# Migration: Updated RPCs + get_session_cookies

## What changed vs. current state
The previous migration already applied most of this SQL. Comparing against the existing DB functions:

1. **`complete_scan_job`** — needs update to add `p_page_title TEXT DEFAULT ''` parameter and set `page_title` on the scans row
2. **`get_session_cookies`** — new RPC (doesn't exist yet), allows the worker to fetch session cookies via SECURITY DEFINER
3. **All other functions** (`dequeue_scan_job`, `fail_scan_job`, `reap_stuck_jobs`, `scanner_heartbeat`) — identical to what's already deployed, but will be harmlessly re-created
4. **Columns/indexes** — `heartbeat_at`, `retry_after`, `content_hash`, `scanner_heartbeats` table already exist; `IF NOT EXISTS` makes these no-ops
5. **Dashboard** — already has realtime subscription, no changes needed
6. **Realtime** — `scans` already added to `supabase_realtime`; the `ALTER PUBLICATION` will fail silently or we wrap it

## Plan

### 1. Run the migration SQL
Execute the exact SQL from the prompt as a new migration. Key effects:
- Column/table/index additions are idempotent (`IF NOT EXISTS`)
- `CREATE OR REPLACE FUNCTION` updates all RPCs including the new `complete_scan_job` signature and new `get_session_cookies`
- The `ALTER PUBLICATION` for `scans` may error since it's already added — we'll wrap it in a DO block to handle gracefully

### 2. Dashboard — no changes needed
The realtime subscription is already in place, no `refetchInterval` exists.

## Files changed
- `supabase/migrations/[timestamp].sql` — new migration with the provided SQL (minor tweak to wrap `ALTER PUBLICATION` in exception handler since `scans` is already in the publication)

