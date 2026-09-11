import type { ReactNode } from "react";
import Link from "next/link";
import { Check, TriangleAlert, Sparkles, ChevronRight } from "lucide-react";
import { Card } from "../Card";
import { PrintButton } from "./PrintButton";
import { BAND_LEGEND, bandClass } from "./insights";
import type { InstitutionOverview } from "./types";

/**
 * CRS Executive Overview — the shared landing for advisors and Executive Leaders.
 * Decisions (2026-08-23): leads with the DISTRIBUTION (status mix + cohorts), never a single
 * composite score; no fabricated KPI deltas or trend (history not retained yet); no peer
 * benchmark (deferred, FR-1); strength bands are the SteppingStone GLOBAL standard (service-
 * returned). The narrative — What/So What (rule-derived) + per-point recommendation — comes from
 * the service (`overview.working`/`concerns`). The `insight` slot streams in AFTER the overview.
 */
export function ExecutiveOverviewView({
  overview,
  insight,
  institutionName,
  basePath,
}: {
  overview: InstitutionOverview;
  /** The Stella institution insight, streamed in after the overview (a Suspense boundary). */
  insight: ReactNode;
  /** WIRE: Lynn — resolved from the session/CRS (org name); omitted until then. */
  institutionName?: string;
  /** Route prefix for drill-down links — "/advisor/crs" (advisor hub) or
   *  "/admin/universities/{id}/crs" (admin hub). Keeps the shared view route-agnostic. */
  basePath: string;
}) {
  const { working, concerns } = overview;
  const generatedDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const distribution = [
    { label: "On Track", count: overview.on_track_count, pct: overview.on_track_pct, cls: "text-green", bar: "bg-green" },
    { label: "At Risk", count: overview.at_risk_count, pct: overview.at_risk_pct, cls: "text-yellow", bar: "bg-yellow" },
    { label: "High Priority", count: overview.high_priority_count, pct: overview.high_priority_pct, cls: "text-red", bar: "bg-red" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Print-only branded header (board-ready PDF) */}
      <div className="mb-4 hidden items-end justify-between border-b border-border pb-3 print:flex">
        <div>
          <div className="text-lg font-bold text-fg">{institutionName ?? "Institution"}</div>
          <div className="text-sm text-muted">Career Readiness Executive Overview · Generated {generatedDate}</div>
        </div>
        <div className="text-right text-xs text-faint">SteppingStone<br />Career Readiness System</div>
      </div>

      {/* Header + PDF export */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Executive Overview</h1>
          <p className="mt-0.5 text-sm text-muted">Institution-wide career readiness{institutionName ? ` for ${institutionName}` : ""}</p>
        </div>
        <div className="print:hidden"><PrintButton /></div>
      </div>

      {/* Distribution — the status mix (not a composite). */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {distribution.map((d) => (
          <Card key={d.label}>
            <div className="text-xs font-medium uppercase tracking-wide text-muted">{d.label}</div>
            <div className={`mt-1 font-display text-3xl font-bold ${d.cls}`}>{d.pct}%</div>
            <div className="mt-0.5 text-sm text-muted">{d.count.toLocaleString()} of {overview.total_students.toLocaleString()} students</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-chip">
              <div className={`h-full rounded-full ${d.bar}`} style={{ width: `${d.pct}%` }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Cohort breakdown — clickable drill-down + the global strength standard. */}
      <Card className="mb-4">
        <div className="mb-3 font-display text-sm font-semibold text-fg">Readiness by Year</div>
        <div className="space-y-2">
          {overview.cohorts.map((c) => {
            const cls = bandClass(c.strength_band);
            return (
              <Link
                key={c.year}
                href={`${basePath}/cohort/${c.year}`}
                className="flex items-center gap-4 rounded-lg border border-border bg-panel-2 px-4 py-2.5 transition-colors hover:bg-hover"
              >
                <div className="w-24 shrink-0">
                  <div className="text-sm font-medium text-fg">Year {c.year}</div>
                  <div className="text-xs text-muted">{c.stage}</div>
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-chip">
                  <div className={`h-full rounded-full ${cls.replace("text-", "bg-")}`} style={{ width: `${c.on_track_pct}%` }} />
                </div>
                <div className={`w-12 shrink-0 text-right text-sm font-semibold ${cls}`}>{c.on_track_pct}%</div>
                <div className={`w-20 shrink-0 rounded-full border border-current/30 px-2 py-0.5 text-center text-xs font-medium ${cls}`}>{c.strength_band ?? "—"}</div>
                <ChevronRight className="size-4 shrink-0 text-faint" />
              </Link>
            );
          })}
        </div>
        {/* The SteppingStone readiness standard (global; WIRE: Lynn — SS-Admin-tunable). */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-soft pt-3 text-xs">
          <span className="text-muted">SteppingStone readiness standard:</span>
          {BAND_LEGEND.map((b) => (
            <span key={b.label} className={b.cls}>
              <span className="font-semibold">{b.label}</span> {b.range}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-faint">Bars show % of students On Track. Click a year to drill in.</p>
      </Card>

      {/* What / So What (rule-derived) + Now What (Stella). */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold text-green">
            <Check className="size-4" /> What&apos;s Working
          </div>
          <div className="space-y-3">
            {working.map((p, i) => (
              <div key={i} className="text-sm">
                <div className="text-fg">{p.what}</div>
                <div className="mt-0.5 text-xs text-muted">{p.soWhat}</div>
                {p.recommendation && <div className="mt-1 text-xs text-indigo">→ {p.recommendation}</div>}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold text-red">
            <TriangleAlert className="size-4" /> Areas of Concern
          </div>
          <div className="space-y-3">
            {concerns.map((p, i) => (
              <div key={i} className="text-sm">
                <div className="text-fg">{p.what}</div>
                <div className="mt-0.5 text-xs text-muted">{p.soWhat}</div>
                {p.recommendation && <div className="mt-1 text-xs text-indigo">→ {p.recommendation}</div>}
              </div>
            ))}
          </div>
        </Card>
        {/* Stella's reading — the ONLY AI-authored panel (freeform), streamed in AFTER the counts so
            the fast overview never waits on the slow model call. Visually distinct from the facts. */}
        <Card className="border-dark-indigo/40 bg-dark-indigo/8">
          <div className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold text-indigo">
            <Sparkles className="size-4" /> Stella&apos;s Reading
          </div>
          <div className="text-sm leading-relaxed text-fg">{insight}</div>
          <p className="mt-3 border-t border-border-soft pt-2 text-xs text-faint">Generated · Stella</p>
        </Card>
      </div>
    </div>
  );
}
