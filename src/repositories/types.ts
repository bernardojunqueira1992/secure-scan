/**
 * Repository contracts — pure interfaces, no infrastructure imports.
 */
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

// ── Scan Repository ──

export type Scan = Tables<"scans">;
export type ScanWithSession = Scan & { scan_sessions: { name: string } | null };

export interface ScanRepository {
  create(data: TablesInsert<"scans">): Promise<Scan>;
  listRecent(limit: number): Promise<ScanWithSession[]>;
  listAll(limit: number): Promise<ScanWithSession[]>;
  getById(id: string): Promise<Scan | null>;
}

// ── Finding Repository ──

export type FindingRow = Tables<"findings">;

export interface FindingRepository {
  listByScan(scanId: string): Promise<FindingRow[]>;
}

// ── Session Repository ──

export type SessionRow = Tables<"scan_sessions">;
export type SessionSummary = Pick<SessionRow, "id" | "name" | "url_pattern" | "expires_at">;

export interface SessionRepository {
  list(): Promise<SessionRow[]>;
  listSummary(): Promise<SessionSummary[]>;
  create(data: TablesInsert<"scan_sessions">): Promise<void>;
  remove(id: string): Promise<void>;
}
