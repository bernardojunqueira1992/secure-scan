

# Fix RLS: Restrict All Tables to Authenticated Users Only

## Current State
All 9 policies use `{public}` role (includes `anon`). RLS is enabled on all tables but the role allows anonymous access. Several tables also lack DELETE protection.

## Important: Table-Specific Constraints
- **`plans`** has NO `user_id` column — it's a reference/pricing table. Cannot use `auth.uid() = user_id`. Will restrict to authenticated read-only.
- **`findings`** has NO `user_id` — access is via `scan_id` join to `scans`. Will keep existing join-based check but restrict to authenticated.
- **`scanner_heartbeats`** has no policies at all — will add authenticated read-only.

## Migration: Single SQL Script

### Drop all existing policies, recreate with `TO authenticated`:

| Table | Policy | Operation | Expression |
|---|---|---|---|
| `findings` | View own findings | SELECT | `EXISTS (SELECT 1 FROM scans WHERE scans.id = findings.scan_id AND scans.user_id = auth.uid())` |
| `plans` | Read plans | SELECT | `true` (reference data, auth-gated) |
| `scan_queue` | View own jobs | SELECT | `EXISTS (SELECT 1 FROM scans WHERE scans.id = scan_queue.scan_id AND scans.user_id = auth.uid())` |
| `scan_sessions` | Manage own | ALL | `auth.uid() = user_id` |
| `scans` | View own | SELECT | `auth.uid() = user_id` |
| `scans` | Insert own | INSERT | `auth.uid() = user_id AND check_scan_quota(auth.uid())` |
| `scans` | Update own | UPDATE | `auth.uid() = user_id` |
| `scheduled_scans` | Manage own | ALL | `auth.uid() = user_id` |
| `subscriptions` | View own | SELECT | `auth.uid() = user_id` |
| `scanner_heartbeats` | View (new) | SELECT | `true` (operational, auth-gated) |

### What about DELETE?
- Tables with `ALL` policies (`scan_sessions`, `scheduled_scans`) already cover DELETE.
- `scans`, `findings`, `scan_queue`, `plans`, `subscriptions` — no DELETE policy means Postgres **blocks DELETE** when RLS is enabled. This is correct behavior. No change needed.

### What does NOT change
- No frontend code changes needed (users already go through `ProtectedRoute`)
- Edge Function unaffected (uses `SERVICE_ROLE_KEY` which bypasses RLS)
- Policy logic stays the same — only the role changes from `public` → `authenticated`

