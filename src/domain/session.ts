/**
 * Pure domain logic for scan sessions — zero infrastructure imports.
 */

export interface SessionStatus {
  readonly label: string;
  readonly color: string;
  readonly dot: string;
}

export function getSessionStatus(expiresAt: string | null): SessionStatus {
  if (!expiresAt) {
    return { label: "Sem expiração", color: "text-muted-foreground", dot: "bg-muted-foreground" };
  }

  const expiryDate = new Date(expiresAt);
  const now = Date.now();

  if (expiryDate.getTime() <= now) {
    return { label: "Expirado", color: "text-destructive", dot: "bg-destructive" };
  }

  const diff = expiryDate.getTime() - now;
  if (diff < 86_400_000) {
    return { label: "Expirando em breve", color: "text-warning", dot: "bg-warning" };
  }

  return { label: "Ativo", color: "text-primary", dot: "bg-primary" };
}

export function validateCookiesJson(cookies: string): void {
  try {
    JSON.parse(cookies);
  } catch {
    throw new Error("JSON inválido. Por favor, cole um JSON de cookies válido.");
  }
}

export interface CreateSessionParams {
  readonly userId: string;
  readonly name: string;
  readonly urlPattern: string;
  readonly cookies: string;
}

export function buildSessionInsert(params: CreateSessionParams) {
  validateCookiesJson(params.cookies);
  return {
    user_id: params.userId,
    name: params.name,
    url_pattern: params.urlPattern,
    cookies_encrypted: params.cookies,
  } as const;
}
