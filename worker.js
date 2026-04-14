/**
 * SecureScan Worker
 * Polls scanner-gateway, runs HTTP security scans, reports results back.
 * Env vars required:
 *   WORKER_API_KEY         – shared secret with scanner-gateway
 *   SCANNER_GATEWAY_URL    – full URL of the scanner-gateway edge function
 *   POLL_INTERVAL_MS       – (optional) polling interval, default 5000
 *   SCANNER_ID             – (optional) worker identity, default "railway-worker"
 */

// Debug: log all env vars present at startup (masks values)
console.log("[worker] env vars present:", Object.keys(process.env).sort().join(", "));
console.log("[worker] SCANNER_GATEWAY_URL =", process.env.SCANNER_GATEWAY_URL ?? "(not set)");
console.log("[worker] WORKER_API_KEY =", process.env.WORKER_API_KEY ? "(set, length=" + process.env.WORKER_API_KEY.length + ")" : "(not set)");

const GATEWAY_URL = (process.env.SCANNER_GATEWAY_URL ?? "").trim();
const WORKER_KEY = (process.env.WORKER_API_KEY ?? "").trim();
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS ?? "5000", 10);
const SCANNER_ID = process.env.SCANNER_ID ?? "railway-worker";

if (!GATEWAY_URL || !WORKER_KEY) {
  console.error(
    "[worker] SCANNER_GATEWAY_URL and WORKER_API_KEY must be set"
  );
  process.exit(1);
}

// ─── Gateway helpers ──────────────────────────────────────────────────────────

async function gateway(action, body = {}) {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-worker-key": WORKER_KEY,
    },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`gateway ${action} → HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function dequeue() {
  const jobs = await gateway("dequeue");
  return Array.isArray(jobs) ? jobs[0] ?? null : null;
}

async function complete(job, score, durationMs, pageTitle, findings) {
  await gateway("complete", {
    p_job_id: job.job_id,
    p_scan_id: job.scan_id,
    p_score: score,
    p_duration_ms: durationMs,
    p_page_title: pageTitle,
    p_findings: findings,
    p_metadata: {},
  });
}

async function fail(job, error) {
  return gateway("fail", {
    p_job_id: job.job_id,
    p_scan_id: job.scan_id,
    p_error: String(error),
  });
}

async function heartbeat(active = 0) {
  await gateway("heartbeat", {
    p_scanner_id: SCANNER_ID,
    p_pool_size: 1,
    p_active: active,
  }).catch((e) => console.warn("[heartbeat] failed:", e.message));
}

// ─── Security Scanner ─────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 15_000;
const FOLLOW_LIMIT = 10;

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Follow redirects manually so we can inspect each hop. */
async function fetchFollowRedirects(rawUrl) {
  let current = rawUrl;
  const chain = [];
  for (let i = 0; i < FOLLOW_LIMIT; i++) {
    const res = await fetchWithTimeout(current, { redirect: "manual" });
    chain.push({ url: current, status: res.status, headers: res.headers });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) break;
      current = new URL(loc, current).href;
    } else {
      return { final: res, chain, finalUrl: current };
    }
  }
  throw new Error("Too many redirects");
}

function parseSetCookies(headers) {
  const raw = [];
  // Node fetch exposes repeated headers via getSetCookie (Node 18+)
  if (typeof headers.getSetCookie === "function") {
    raw.push(...headers.getSetCookie());
  } else {
    const v = headers.get("set-cookie");
    if (v) raw.push(v);
  }
  return raw.map((c) => {
    const lower = c.toLowerCase();
    return {
      raw: c,
      name: c.split("=")[0].trim(),
      secure: lower.includes(";secure") || lower.includes("; secure"),
      httpOnly: lower.includes(";httponly") || lower.includes("; httponly"),
      sameSite: lower.includes("samesite=none")
        ? "none"
        : lower.includes("samesite=lax")
        ? "lax"
        : lower.includes("samesite=strict")
        ? "strict"
        : null,
    };
  });
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : "";
}

async function runScan(rawUrl) {
  const startedAt = Date.now();
  const findings = [];

  function finding(severity, type, title, description, location, remediation, metadata = {}) {
    findings.push({ severity, type, title, description, location, remediation, metadata });
  }

  // Normalise URL
  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  // 1. HTTPS enforcement
  if (parsedUrl.protocol === "http:") {
    finding(
      "HIGH",
      "no-https",
      "Site não força HTTPS",
      "O URL foi acessado via HTTP sem redirecionar para HTTPS.",
      rawUrl,
      "Configure redirecionamento 301/302 de HTTP para HTTPS e habilite HSTS."
    );
  }

  // 2. Fetch final response (following redirects)
  let finalRes, chain, finalUrl;
  try {
    ({ final: finalRes, chain, finalUrl } = await fetchFollowRedirects(parsedUrl.href));
  } catch (e) {
    throw new Error(`Falha ao acessar o site: ${e.message}`);
  }

  // 3. HTTP→HTTPS redirect check
  const startsHttp = parsedUrl.protocol === "http:";
  const endsHttps = finalUrl.startsWith("https://");
  if (startsHttp && !endsHttps) {
    finding(
      "HIGH",
      "http-no-redirect",
      "Sem redirecionamento HTTP→HTTPS",
      "O site HTTP não redireciona para HTTPS.",
      rawUrl,
      "Configure o servidor web para redirecionar todo tráfego HTTP para HTTPS."
    );
  }
  if (!startsHttp && chain.length > 1) {
    // Inspect redirect chain for open redirect or HTTP downgrade
    for (const hop of chain) {
      if (hop.status >= 300 && hop.status < 400) {
        const loc = hop.headers.get("location") ?? "";
        if (loc.startsWith("http://")) {
          finding(
            "MEDIUM",
            "https-downgrade",
            "Redirect faz downgrade para HTTP",
            `Redirect de ${hop.url} para ${loc} faz downgrade de HTTPS para HTTP.`,
            hop.url,
            "Garanta que todos os redirects apontem para URLs HTTPS."
          );
        }
      }
    }
  }

  const h = finalRes.headers;

  // 4. HSTS
  const hsts = h.get("strict-transport-security");
  if (!hsts) {
    finding(
      "HIGH",
      "missing-hsts",
      "Header HSTS ausente",
      "O header Strict-Transport-Security não está presente, permitindo ataques de downgrade.",
      finalUrl,
      "Adicione: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"
    );
  } else {
    const maxAge = parseInt(hsts.match(/max-age=(\d+)/)?.[1] ?? "0", 10);
    if (maxAge < 15552000) {
      finding(
        "MEDIUM",
        "weak-hsts",
        "HSTS com max-age curto",
        `max-age=${maxAge} é menor que 180 dias (15552000s).`,
        finalUrl,
        "Aumente max-age para pelo menos 31536000 (1 ano)."
      );
    }
  }

  // 5. X-Frame-Options / CSP frame-ancestors
  const xfo = h.get("x-frame-options");
  const csp = h.get("content-security-policy");
  const cspHasFrameAncestors = csp?.toLowerCase().includes("frame-ancestors");
  if (!xfo && !cspHasFrameAncestors) {
    finding(
      "MEDIUM",
      "clickjacking",
      "Proteção contra Clickjacking ausente",
      "Nem X-Frame-Options nem CSP frame-ancestors estão configurados.",
      finalUrl,
      "Adicione: X-Frame-Options: DENY  ou  Content-Security-Policy: frame-ancestors 'none'"
    );
  }

  // 6. X-Content-Type-Options
  if (!h.get("x-content-type-options")) {
    finding(
      "LOW",
      "missing-xcto",
      "X-Content-Type-Options ausente",
      "Sem este header, o browser pode fazer MIME-type sniffing.",
      finalUrl,
      "Adicione: X-Content-Type-Options: nosniff"
    );
  }

  // 7. Content-Security-Policy
  if (!csp) {
    finding(
      "HIGH",
      "missing-csp",
      "Content-Security-Policy ausente",
      "Sem CSP, o site está vulnerável a ataques XSS.",
      finalUrl,
      "Defina uma política CSP restritiva, começando com default-src 'none'."
    );
  } else {
    if (csp.includes("unsafe-inline")) {
      finding(
        "MEDIUM",
        "csp-unsafe-inline",
        "CSP permite 'unsafe-inline'",
        "'unsafe-inline' na CSP permite scripts inline, enfraquecendo a proteção contra XSS.",
        finalUrl,
        "Substitua 'unsafe-inline' por hashes ou nonces específicos."
      );
    }
    if (csp.includes("unsafe-eval")) {
      finding(
        "MEDIUM",
        "csp-unsafe-eval",
        "CSP permite 'unsafe-eval'",
        "'unsafe-eval' permite eval() e Function(), aumentando superfície de XSS.",
        finalUrl,
        "Remova 'unsafe-eval' e refatore o código que depende de eval."
      );
    }
    if (csp.includes("*")) {
      finding(
        "MEDIUM",
        "csp-wildcard",
        "CSP usa wildcard (*)",
        "Wildcards em CSP permitem carregar recursos de qualquer origem.",
        finalUrl,
        "Especifique origens explícitas em vez de usar '*'."
      );
    }
  }

  // 8. Referrer-Policy
  if (!h.get("referrer-policy")) {
    finding(
      "LOW",
      "missing-referrer-policy",
      "Referrer-Policy ausente",
      "Sem Referrer-Policy, URLs completas (com tokens/dados sensíveis) podem vazar via Referer.",
      finalUrl,
      "Adicione: Referrer-Policy: strict-origin-when-cross-origin"
    );
  }

  // 9. Permissions-Policy
  if (!h.get("permissions-policy") && !h.get("feature-policy")) {
    finding(
      "LOW",
      "missing-permissions-policy",
      "Permissions-Policy ausente",
      "Sem Permissions-Policy, APIs sensíveis (câmera, microfone, geolocalização) ficam sem restrição.",
      finalUrl,
      "Adicione: Permissions-Policy: camera=(), microphone=(), geolocation=()"
    );
  }

  // 10. Information disclosure — Server / X-Powered-By
  const server = h.get("server");
  if (server && /[0-9]/.test(server)) {
    finding(
      "LOW",
      "server-version-disclosure",
      "Header Server expõe versão",
      `Server: ${server} — versões expostas facilitam ataques direcionados.`,
      finalUrl,
      "Configure o servidor para omitir a versão no header Server."
    );
  }
  const xpb = h.get("x-powered-by");
  if (xpb) {
    finding(
      "LOW",
      "x-powered-by-disclosure",
      "Header X-Powered-By presente",
      `X-Powered-By: ${xpb} — expõe informações da stack.`,
      finalUrl,
      "Remova o header X-Powered-By da configuração do servidor."
    );
  }

  // 11. CORS
  const acao = h.get("access-control-allow-origin");
  if (acao === "*") {
    finding(
      "MEDIUM",
      "cors-wildcard",
      "CORS permite qualquer origem (*)",
      "Access-Control-Allow-Origin: * permite que qualquer site leia respostas desta API.",
      finalUrl,
      "Restrinja CORS a origens específicas confiáveis."
    );
  }

  // 12. Cookies
  const cookies = parseSetCookies(h);
  for (const ck of cookies) {
    if (!ck.secure) {
      finding(
        "HIGH",
        "cookie-no-secure",
        `Cookie "${ck.name}" sem flag Secure`,
        "Cookies sem Secure podem ser transmitidos via HTTP, expostos a interceptação.",
        finalUrl,
        `Adicione a flag Secure ao cookie "${ck.name}".`
      );
    }
    if (!ck.httpOnly) {
      finding(
        "MEDIUM",
        "cookie-no-httponly",
        `Cookie "${ck.name}" sem flag HttpOnly`,
        "Cookies sem HttpOnly são acessíveis via JavaScript, facilitando roubo em ataques XSS.",
        finalUrl,
        `Adicione a flag HttpOnly ao cookie "${ck.name}".`
      );
    }
    if (ck.sameSite === null || ck.sameSite === "none") {
      finding(
        "MEDIUM",
        "cookie-no-samesite",
        `Cookie "${ck.name}" sem SameSite adequado`,
        "Sem SameSite ou com SameSite=None, o cookie pode ser enviado em requisições cross-site (CSRF).",
        finalUrl,
        `Adicione SameSite=Strict ou SameSite=Lax ao cookie "${ck.name}".`
      );
    }
  }

  // 13. Try to get page title
  let pageTitle = "";
  try {
    const ct = h.get("content-type") ?? "";
    if (ct.includes("text/html")) {
      const text = await finalRes.text();
      pageTitle = extractTitle(text);
    }
  } catch {
    // non-critical
  }

  // 14. Score calculation
  const weights = { CRITICAL: 25, HIGH: 15, MEDIUM: 8, LOW: 3, INFO: 0 };
  const deductions = findings.reduce((acc, f) => acc + (weights[f.severity] ?? 0), 0);
  const score = Math.max(0, 100 - deductions);

  const durationMs = Date.now() - startedAt;
  return { score, durationMs, pageTitle, findings };
}

// ─── Main loop ────────────────────────────────────────────────────────────────

let activeScans = 0;

async function tick() {
  await heartbeat(activeScans);

  if (activeScans > 0) return; // single-concurrency for now

  let job;
  try {
    job = await dequeue();
  } catch (e) {
    console.warn("[worker] dequeue error:", e.message);
    return;
  }

  if (!job) return;

  activeScans++;
  console.log(`[worker] starting scan: ${job.scan_id} → ${job.url}`);
  try {
    const { score, durationMs, pageTitle, findings } = await runScan(job.url);
    await complete(job, score, durationMs, pageTitle, findings);
    console.log(
      `[worker] completed: ${job.scan_id} score=${score} findings=${findings.length} (${durationMs}ms)`
    );
  } catch (e) {
    console.error(`[worker] scan failed: ${job.scan_id}`, e.message);
    try {
      const willRetry = await fail(job, e.message);
      console.log(`[worker] job ${job.job_id} willRetry=${willRetry}`);
    } catch (fe) {
      console.error("[worker] fail RPC error:", fe.message);
    }
  } finally {
    activeScans--;
  }
}

console.log(`[worker] starting — gateway=${GATEWAY_URL} id=${SCANNER_ID} poll=${POLL_INTERVAL}ms`);
heartbeat(0).catch(() => {});
setInterval(tick, POLL_INTERVAL);
tick();
