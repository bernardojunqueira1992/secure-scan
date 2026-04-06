/**
 * Pure domain logic for Scans — zero infrastructure imports.
 */

export interface CreateScanParams {
  readonly url: string;
  readonly userId: string;
  readonly sessionId: string | null;
}

export interface ScanInsertData {
  readonly url: string;
  readonly user_id: string;
  readonly session_id?: string;
}

export function buildScanInsert(params: CreateScanParams): ScanInsertData {
  const base: ScanInsertData = {
    url: params.url,
    user_id: params.userId,
  };

  if (params.sessionId) {
    return { ...base, session_id: params.sessionId };
  }

  return base;
}

/** Severity ordering for report grouping */
export const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type Severity = (typeof SEVERITY_ORDER)[number];

export const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "crítico",
  HIGH: "alto",
  MEDIUM: "médio",
  LOW: "baixo",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "pendente",
  running: "executando",
  completed: "concluído",
  failed: "falhou",
};

export function statusIcon(status: string): string {
  const icons: Record<string, string> = {
    completed: "✓",
    failed: "✗",
    running: "⟳",
  };
  return icons[status] ?? "⏳";
}

export interface Finding {
  readonly id: string;
  readonly severity: string;
  readonly title: string;
  readonly description: string | null;
  readonly location: string | null;
  readonly remediation: string | null;
  readonly type: string;
}

/** Group findings by severity in defined order */
export function groupFindingsBySeverity<T extends { severity: string }>(
  findings: T[]
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const sev of SEVERITY_ORDER) {
    const items = findings.filter((f) => f.severity === sev);
    if (items.length > 0) result[sev] = items;
  }
  return result;
}

/** Pick top N easy-to-fix findings (MEDIUM/LOW) as quick wins */
export function pickQuickWins<T extends { severity: string }>(
  findings: T[],
  limit = 3
): T[] {
  return findings
    .filter((f) => f.severity === "MEDIUM" || f.severity === "LOW")
    .slice(0, limit);
}
