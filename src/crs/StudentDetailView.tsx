import Link from "next/link";
import { ArrowLeft, Info, TriangleAlert } from "lucide-react";
import { Card } from "../Card";
import { ArchetypeChip } from "./ArchetypeChip";
import { AskStella } from "./AskStella";
import { SendEmail } from "./SendEmail";
import { STAGE_LABELS as STAGE, STAGE_DESC } from "./constants";
import type { StudentDetail, Status, AskStellaFn, GenerateOutreachFn } from "./types";

/* CRS Student detail — ported from the standalone CRS UI. Leads with status + archetype;
 * NEVER shows the numeric readiness score (readiness is a distribution). Restyled to Hub tokens. */

// Demo — go-live: derive class year from the cohort.
const GRAD_YEAR: Record<number, number> = { 1: 2029, 2: 2028, 3: 2027, 4: 2026 };

const STATUS: Record<Status, { text: string; chip: string; soft: string }> = {
  "On Track": { text: "text-green", chip: "bg-green/12 text-green border-green/40", soft: "bg-green/8 border-green/30" },
  "At Risk": { text: "text-yellow", chip: "bg-yellow/12 text-yellow border-yellow/40", soft: "bg-yellow/8 border-yellow/30" },
  "High Priority": { text: "text-red", chip: "bg-red/12 text-red border-red/40", soft: "bg-red/8 border-red/30" },
};
const MOMENTUM: Record<string, { t: string; c: string; sub: string }> = {
  up: { t: "↑ Improving", c: "text-green", sub: "Up in last 30 days" },
  down: { t: "↓ Declining", c: "text-red", sub: "Down in last 30 days" },
  stable: { t: "→ Stable", c: "text-muted", sub: "Steady in last 30 days" },
};
const ORDINAL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0][0] + p[1][0] : name.slice(0, 2)).toUpperCase();
}
function ago(ts?: string | null) {
  if (!ts) return "";
  const days = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  return days <= 0 ? "today" : days === 1 ? "1 day ago" : days < 30 ? `${days} days ago` : new Date(ts).toLocaleDateString();
}
// Address the student by name in Stella's insight (the backend text is guid-generic).
// GO-LIVE (Lynn): pass the first name into generate_insight so the whole insight reads by name.
function personalizeInsight(text: string, name: string) {
  if (!text) return text;
  const first = name.trim().split(/\s+/)[0] || "This student";
  const aOrAn = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");
  return text
    .replace(/^This\s+'([A-Za-z][A-Za-z -]*?)'\s+student\s+/i, (_m, arch: string) => `${first} is ${aOrAn(arch)} ${arch} student who `)
    .replace(/^This\s+student\s+is\s+/i, `${first} is `)
    .replace(/^This\s+student\b/i, first);
}

export function StudentDetailView({ student, askStella, generateOutreachDrafts }: { student: StudentDetail; askStella: AskStellaFn; generateOutreachDrafts: GenerateOutreachFn }) {
  const name = student.display_name ?? student.student_guid;
  const firstName = name.split(/\s+/)[0];
  const yr = student.year_in_program;
  const st = STATUS[student.status];
  const mo = MOMENTUM[student.momentum_direction] ?? MOMENTUM.stable;
  const lastAct = student.activity_feed[0];

  const complete = student.milestones.filter((m) => m.state === "complete");
  const inProgress = student.milestones.filter((m) => m.state === "in_progress");
  const notStarted = student.milestones.filter((m) => m.state === "not_started");

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <Link href={`/advisor/crs/cohort/${yr}/students`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Back
      </Link>

      {/* Profile card */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-indigo/15 text-lg font-bold text-indigo">
            {initials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl font-semibold text-fg">{name}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Chip>{ORDINAL[yr] ?? `${yr}th`} Year</Chip>
              {student.major && <Chip>{student.major}</Chip>}
              <Chip>Class of {GRAD_YEAR[yr] ?? "—"}</Chip>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              {/* Email/ID — go-live: resolve from platform (CRS store is guid-only). */}
              <span>ID {student.student_guid.slice(0, 8)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <Stat label="Status">
              <span className={`inline-flex rounded-full border px-3 py-0.5 text-sm font-medium ${st.chip}`}>{student.status}</span>
            </Stat>
            {student.archetype && (
              <Stat label="Archetype"><ArchetypeChip archetype={student.archetype} /></Stat>
            )}
            <Stat label="Momentum">
              <div className={`text-sm font-semibold ${mo.c}`}>{mo.t}</div>
              <div className="text-xs text-muted">{mo.sub}</div>
            </Stat>
            <Stat label="Last Activity">
              <div className="text-sm font-semibold text-fg">{lastAct ? lastAct.description : "—"}</div>
              <div className="text-xs text-muted">{lastAct ? ago(lastAct.timestamp) : ""}</div>
            </Stat>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {/* Journey + milestones + why */}
          <Card>
            <div className="mb-3 font-display text-sm font-semibold text-fg">
              Career Readiness Journey — Year {yr}: {STAGE[yr - 1]} Stage
            </div>
            <p className="rounded-md border-l-2 border-indigo/50 bg-chip px-3 py-2.5 text-sm leading-snug text-muted">
              At the <span className="font-semibold text-fg">{STAGE[yr - 1]} Stage</span>, {firstName} should be {STAGE_DESC[yr]}
            </p>

            {/* Journey track */}
            <div className="mt-5 flex items-center">
              {[1, 2, 3, 4].map((stage, idx) => (
                <div key={stage} className="contents">
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    stage < yr ? "border-green bg-green/15 text-green"
                      : stage === yr ? `${st.text} border-current bg-chip`
                      : "border-border bg-chip text-faint"
                  }`}>
                    {stage < yr ? "✓" : "○"}
                  </div>
                  {idx < 3 && <div className={`h-0.5 flex-1 ${stage + 1 <= yr ? "bg-green/50" : "bg-border"}`} />}
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex">
              {[1, 2, 3, 4].map((stage, idx) => (
                <div key={stage} className="contents">
                  <div className="flex flex-col items-center">
                    <div className={`text-xs font-medium ${stage < yr ? "text-green" : stage === yr ? st.text : "text-faint"}`}>{STAGE[stage - 1]}</div>
                    <div className="text-[11px] text-muted">Year {stage}</div>
                  </div>
                  {idx < 3 && <div className="flex-1" />}
                </div>
              ))}
            </div>

            {/* Milestones */}
            <div className="mt-5 border-t border-border-soft pt-4">
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Year {yr} Milestones</div>
              <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border sm:grid-cols-3">
                <MilestoneCol title="✓ Complete" titleClass="text-green" items={complete.map((m) => m.label)} bordered />
                <MilestoneCol title="◉ In Progress" titleClass="text-yellow" items={inProgress.map((m) => m.label)} bordered />
                <MilestoneCol title="○ Not Started" titleClass="text-muted" items={notStarted.map((m) => m.label)} />
              </div>
            </div>

            {/* Why [status] */}
            {student.risk_factors.length > 0 && student.status !== "On Track" && (
              <div className={`mt-4 rounded-lg border p-4 ${st.soft}`}>
                <div className={`mb-2.5 flex items-center gap-1.5 text-sm font-semibold ${st.text}`}>
                  <TriangleAlert className="size-4" /> Why {firstName} is {student.status}
                </div>
                <div className="space-y-2">
                  {student.risk_factors.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-fg">
                      {r.severity === "warning"
                        ? <TriangleAlert className={`mt-0.5 size-3.5 shrink-0 ${st.text}`} />
                        : <Info className="mt-0.5 size-3.5 shrink-0 text-muted" />}
                      <span>{r.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Activity + next steps */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <div className="mb-2 font-display text-sm font-semibold text-fg">Recent Activity</div>
              {student.activity_feed.length ? (
                <div className="divide-y divide-border-soft">
                  {student.activity_feed.slice(0, 6).map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 py-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-fg">{a.description || a.type.replace(/_/g, " ")}</div>
                      </div>
                      <div className="shrink-0 text-xs text-muted">{ago(a.timestamp)}</div>
                    </div>
                  ))}
                </div>
              ) : <div className="py-3 text-sm text-muted">No recent activity.</div>}
            </Card>
            <Card>
              <div className="mb-2 font-display text-sm font-semibold text-fg">Recommended Next Steps</div>
              {student.recommended_next_steps.length ? (
                <div className="space-y-2">
                  {student.recommended_next_steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border bg-chip px-3 py-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo/15 text-xs font-semibold text-indigo">{i + 1}</span>
                      <span className="text-sm text-fg">{step}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="py-3 text-sm text-muted">No recommendations.</div>}
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <AskStella studentGuid={student.student_guid} firstName={firstName} archetype={student.archetype} askStella={askStella} />
          <SendEmail studentGuid={student.student_guid} firstName={firstName} generateOutreachDrafts={generateOutreachDrafts} />
          {student.stella_insights.length > 0 && (
            <Card className="border-dark-indigo/40 bg-dark-indigo/8">
              <div className="text-sm leading-snug text-fg">
                <span className="font-semibold text-indigo">✦ Stella:</span>{" "}
                {personalizeInsight(student.stella_insights[0], name)}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full border border-border bg-chip px-2.5 py-0.5 text-xs text-muted">{children}</span>;
}
function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
      {children}
    </div>
  );
}
function MilestoneCol({ title, titleClass, items, bordered }: { title: string; titleClass: string; items: string[]; bordered?: boolean }) {
  return (
    <div className={bordered ? "border-b border-border sm:border-b-0 sm:border-r" : ""}>
      <div className={`bg-panel-2 px-3 py-2 text-xs font-semibold ${titleClass}`}>{title}</div>
      <div className="flex flex-col gap-1.5 px-3 py-2.5">
        {items.length ? items.map((label, i) => <div key={i} className="text-sm text-fg">{label}</div>) : <span className="text-sm text-faint">—</span>}
      </div>
    </div>
  );
}
