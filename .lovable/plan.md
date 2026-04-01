

# SecureScan - Security Scanning Platform

## Overview
Build the frontend and Lovable Cloud backend for SecureScan, an automated security scanning SaaS. The Scanner Service (Puppeteer on Railway) is out of scope for Lovable but the architecture will be ready to connect to it.

## Phase 1: Foundation & Auth

### Authentication
- Email/password signup & login via Lovable Cloud Auth
- Protected routes for dashboard, sessions, scan history
- Simple onboarding flow

### Database Setup
- Create all core tables: `scans`, `findings`, `scan_sessions`, `scan_queue`, `plans`, `subscriptions`, `scheduled_scans`
- RLS policies for user isolation
- Postgres functions: `dequeue_scan_job`, `check_scan_quota`, `notify_new_job` trigger
- Seed default plans (free, pro, team)

## Phase 2: Core UI

### Landing Page
- Hero section explaining the value prop (1-click security scanning)
- Feature highlights: authenticated scanning, score tracking, actionable reports
- Pricing table (Free / Pro / Team)
- CTA to sign up

### Dashboard (Main App)
- **Quick Scan Form**: URL input + optional session selector dropdown + "Scan Now" button
- **Recent Scans**: Table showing last scans with URL, score badge (🟢🟡🔴), session used, date, link to report
- **Scan Status**: Real-time progress indicator (pending → running → completed) using Lovable Cloud Realtime

### Scan Report Page
- Security Score display (0-100) with color-coded badge
- Findings grouped by severity (CRITICAL → LOW)
- Each finding shows: title, description, location, remediation steps
- "Quick Wins" section: top 3 easiest fixes with time estimates
- Export buttons (JSON, CSV) — PDF in Phase 2

### Login Sessions Manager
- List saved sessions with name, URL pattern, expiry status, last used
- "Add New Session" modal: name, URL pattern, cookies JSON textarea with instructions
- Edit/delete sessions
- Visual indicators for expired/expiring sessions

### Scan History Page
- Score trend chart (Recharts line graph)
- Filterable scan table (by URL, session, date range)
- Comparison indicators (improved/worsened/stable)

## Phase 3: Backend Edge Functions

### Scanner API Endpoints (Edge Functions)
- `POST /scanner/next-job` — dequeue next pending job (called by Railway scanner)
- `POST /scanner/scans/:id/complete` — receive scan results from scanner
- `POST /scanner/scans/:id/fail` — mark scan as failed
- `POST /scanner/jobs/:id/requeue` — retry failed job
- `GET /scanner/sessions/:id/cookies` — return decrypted cookies for scanner
- All endpoints authenticated with a `SCANNER_API_KEY` secret

### User-Facing Server Actions
- `createScan` — validate quota, insert scan + queue job
- `getScanResults` — fetch scan with findings
- `manageSessions` — CRUD for login sessions (encrypt cookies on insert)

## Design Direction
- Dark theme with security/cyber aesthetic
- Primary accent: green (#22C55E) for safe, red for critical
- Clean dashboard layout with cards and data tables
- Shield/lock iconography throughout

## Architecture Notes
- The Railway Scanner Service (Puppeteer + Chrome) is external — this plan builds everything it connects TO
- Edge functions will serve as the API layer between the scanner and the database
- Realtime subscriptions will update scan status in the UI without polling
- Cookie encryption uses pgcrypto AES-256 via Postgres functions

