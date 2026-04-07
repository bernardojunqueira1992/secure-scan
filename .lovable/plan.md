

# Deploy Scanner Gateway Edge Function

## What this does
Creates a secure proxy (Edge Function) so the Railway worker can communicate with the database without needing the service role key directly. The worker authenticates with a shared secret (`x-worker-key`), and the Edge Function uses the service role key internally.

## Steps

### 1. Add WORKER_API_KEY secret
Use the `add_secret` tool to ask you to input the shared secret the worker will use to authenticate with the gateway.

### 2. Create Edge Function `scanner-gateway`
**File:** `supabase/functions/scanner-gateway/index.ts`

A Deno HTTP handler that:
- Validates `x-worker-key` header against the `WORKER_API_KEY` secret
- Routes actions (`dequeue`, `complete`, `fail`, `heartbeat`, `get_session_cookies`) to the corresponding Supabase RPC calls using `SUPABASE_SERVICE_ROLE_KEY` (auto-available)
- Includes CORS headers
- Returns JSON responses

Supported actions matching `IJobRepository`:
| Action | RPC Called |
|---|---|
| `dequeue` | `dequeue_scan_job()` |
| `complete` | `complete_scan_job(...)` |
| `fail` | `fail_scan_job(...)` |
| `heartbeat` | `scanner_heartbeat(...)` |
| `get_session_cookies` | `get_session_cookies(...)` |

### 3. Deploy and test
Deploy the function automatically, then test with `curl_edge_functions` to verify:
- Returns 401 without the key
- Returns data with the correct key

No database changes needed — all RPCs already exist.

