/*
 * Hub monitoring — the hub-side half of Lynn's design (2026-09-30, cross-hub X-10):
 *
 *  • OUTSIDE-IN: a browser canary loads each hub's `/canary` route and asserts the marker it renders.
 *    `canaryPage` builds that response so every hub says OK / FAIL the same way.
 *  • INSIDE-OUT: when a real user hits an unhandled error, the hub reports it. `reportClientError` is the
 *    browser side: it POSTs to the hub's own `/api/client-error` route, which forwards server-to-server
 *    with the app key and the signed-in member (the browser never holds a platform credential, and the
 *    endpoint on headless can stay closed). Every failure here is swallowed: a reporter that throws
 *    inside an error boundary would replace the error screen with a blank one.
 */

/** What the browser tells the hub about an error a person actually hit. */
export interface ClientErrorReport {
  /** Which trap caught it. */
  source: "boundary" | "global-boundary" | "window" | "unhandledrejection";
  /** The route the person was on (`location.pathname`), so incidents cluster by screen. */
  route: string;
  message: string;
  /** Truncated by the hub route before it leaves the hub. */
  stack?: string;
  /** Next's server-error reference, when the boundary had one — the same value the server log carries. */
  digest?: string;
}

/** The hub-local route every hub exposes; the server side forwards to headless. */
export const CLIENT_ERROR_PATH = "/api/client-error";

/** One report per distinct (route, message) per minute — a render loop must not become a flood. */
const RECENT_TTL_MS = 60_000;
const recent = new Map<string, number>();

/**
 * Report an error from the browser. Fire-and-forget: `keepalive` lets the request finish while the
 * page unloads or re-renders, and nothing is awaited or thrown.
 */
export function reportClientError(report: ClientErrorReport): void {
  try {
    if (typeof fetch !== "function") return;
    const key = `${report.route}|${report.message}`;
    const now = Date.now();
    const last = recent.get(key);
    if (last !== undefined && now - last < RECENT_TTL_MS) return;
    recent.set(key, now);
    if (recent.size > 200) recent.clear();
    void fetch(CLIENT_ERROR_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never let the reporter be the error */
  }
}

/** Test seam: forget what was reported recently. */
export function resetClientErrorDedupe(): void {
  recent.clear();
}

/** Turn whatever a window error handler received into a message + stack. */
export function describeThrown(value: unknown): { message: string; stack?: string } {
  if (value instanceof Error) return { message: value.message || value.name, stack: value.stack };
  if (typeof value === "string") return { message: value };
  try {
    return { message: JSON.stringify(value).slice(0, 500) };
  } catch {
    return { message: String(value) };
  }
}

/* ── The canary page ─────────────────────────────────────────────────────────────────────── */

/** One shallow self-check the hub ran before answering the canary. */
export interface CanaryCheck {
  name: string;
  ok: boolean;
  /** Why it failed, in a few words; omitted when ok. */
  detail?: string;
}

/**
 * The marker the browser canary asserts on, and its status. `data-canary` is the contract: "ok" or
 * "fail"; the text carries the build so a canary log says which deploy answered. 200 when every check
 * passed, 503 otherwise — so a plain HTTP probe also sees the truth, even though the canary itself
 * asserts the rendered marker.
 */
export function canaryPage(input: { hub: string; build: string; checks: CanaryCheck[] }): Response {
  const failed = input.checks.filter((c) => !c.ok);
  const ok = failed.length === 0;
  const build = input.build || "unknown";
  const reasons = failed.map((c) => `${c.name}${c.detail ? `: ${c.detail}` : ""}`).join("; ");
  const body =
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(input.hub)} canary</title></head>` +
    `<body data-canary="${ok ? "ok" : "fail"}" data-build="${escapeHtml(build)}">` +
    `<pre>${ok ? "OK" : "FAIL"} ${escapeHtml(input.hub)} ${escapeHtml(build)}${ok ? "" : `\n${escapeHtml(reasons)}`}</pre>` +
    `</body></html>`;
  return new Response(body, {
    status: ok ? 200 : 503,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

/** The deployment lane, read off the hub's own public origin. */
export function laneFromOrigin(origin: string | undefined): "dev" | "qa" | "prod" | "local" {
  if (!origin) return "local";
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return "local";
  }
  if (host.includes(".dev.")) return "dev";
  if (host.includes(".qa.")) return "qa";
  if (host.startsWith("localhost") || host.startsWith("127.")) return "local";
  return "prod";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
