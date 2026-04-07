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
export const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as const;
export type Severity = (typeof SEVERITY_ORDER)[number];

export const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "crítico",
  HIGH: "alto",
  MEDIUM: "médio",
  LOW: "baixo",
  INFO: "informativo",
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

/** Pick top N easy-to-fix findings (MEDIUM/LOW) sorted by ascending severity */
export function pickQuickWins<T extends { severity: string }>(
  findings: T[],
  limit = 3
): T[] {
  const order: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
  return findings
    .filter((f) => f.severity === "MEDIUM" || f.severity === "LOW")
    .sort((a, b) => (order[a.severity] ?? 99) - (order[b.severity] ?? 99))
    .slice(0, limit);
}

/** Map numeric score to letter grade */
export function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D+";
  if (score >= 45) return "D";
  if (score >= 40) return "D-";
  return "F";
}

/** Tailwind text color class for a grade letter */
export function gradeColor(grade: string): string {
  const letter = grade.charAt(0);
  if (letter === "A" || letter === "B") return "text-primary";
  if (letter === "C") return "text-warning";
  return "text-destructive";
}

/** Tailwind bg color class for a grade letter */
export function gradeBgColor(grade: string): string {
  const letter = grade.charAt(0);
  if (letter === "A" || letter === "B") return "bg-primary/20 border-primary/40";
  if (letter === "C") return "bg-warning/20 border-warning/40";
  return "bg-destructive/20 border-destructive/40";
}

/** Count findings per severity */
export function countBySeverity<T extends { severity: string }>(
  findings: T[]
): Record<string, number> {
  const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const f of findings) {
    counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  }
  return counts;
}
