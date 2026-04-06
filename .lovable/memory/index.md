# Project Memory

## Core
SecureScan - security scanning SaaS. Dark cyber theme. Primary green #22C55E, bg #090D14.
JetBrains Mono headings, Inter body. Lovable Cloud backend (Postgres + Auth).
Scanner Service (Puppeteer/Railway) is external — Lovable builds the frontend + API layer.
Tables: scans, findings, scan_sessions, scan_queue, plans, subscriptions, scheduled_scans.
Interface 100% PT-BR (sem i18n, substituição direta). date-fns locale ptBR.
Architecture: domain/ (pure logic) + repositories/ (Supabase impl) + pages (presentation).
strict: true, noImplicitAny: true. Zero `any` allowed.

## Memories
- [Design tokens](mem://design/tokens) — Dark cyber security theme with green primary, red destructive, JetBrains Mono + Inter fonts
- [Architecture](mem://features/architecture) — Frontend (Lovable) + Cloud backend (Postgres/Auth/Edge Functions) + external Railway scanner
