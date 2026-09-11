import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Card } from "../Card";
import { stageLabel, STAGE_DESC } from "./constants";
import type { CohortSummary, Status } from "./types";

/**
 * CRS Year Overview — the middle drill level (Institution → YEAR → status → student). Rows are
 * the readiness distribution for the year; each drills into the student list filtered by status.
 * Derived from the live cohort distribution — no fabricated per-year metrics or trends.
 */
const STATUS_ROWS: { status: Status; cls: string; bar: string; desc: (stage: string) => string }[] = [
  { status: "On Track", cls: "text-green", bar: "bg-green", desc: (s) => `Progressing well through the ${s} stage.` },
  { status: "At Risk", cls: "text-yellow", bar: "bg-yellow", desc: () => "Engaged but showing gaps against key milestones." },
  { status: "High Priority", cls: "text-red", bar: "bg-red", desc: () => "Key milestones unmet — needs immediate outreach." },
];

export function YearOverviewView({ cohort, basePath }: { cohort: CohortSummary; basePath: string }) {
  const stage = stageLabel(cohort.year);
  const cell = (s: Status) =>
    s === "On Track"
      ? { pct: cohort.on_track_pct, count: cohort.on_track_count }
      : s === "At Risk"
        ? { pct: cohort.at_risk_pct, count: cohort.at_risk_count }
        : { pct: cohort.high_priority_pct, count: cohort.high_priority_count };

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <Link href={basePath} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-fg">Year {cohort.year} — {stage} Stage</h1>
        <p className="mt-0.5 text-sm text-muted">Students are {STAGE_DESC[cohort.year] ?? "progressing through their career-readiness journey."}</p>
      </div>

      <Card>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="font-display text-sm font-semibold text-fg">Students by Readiness Status</span>
          <span className="text-xs text-muted">Click a row to view students</span>
        </div>
        <div className="space-y-2">
          {STATUS_ROWS.map((row) => {
            const c = cell(row.status);
            return (
              <Link
                key={row.status}
                href={`${basePath}/cohort/${cohort.year}/students?status=${encodeURIComponent(row.status)}`}
                className="flex items-center gap-4 rounded-lg border border-border bg-panel-2 px-4 py-3 transition-colors hover:bg-hover"
              >
                <div className={`h-10 w-1 shrink-0 rounded-full ${row.bar}`} />
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold ${row.cls}`}>● {row.status}</div>
                  <div className="truncate text-xs text-muted">{row.desc(stage)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`font-display text-lg font-bold ${row.cls}`}>{c.pct}%</div>
                </div>
                <div className="w-20 shrink-0 text-right">
                  <div className="text-sm font-semibold text-fg">{c.count}</div>
                  <div className="text-xs text-muted">students</div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-faint" />
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
