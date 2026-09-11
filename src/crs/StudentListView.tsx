"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Download, Sparkles } from "lucide-react";
import { ArchetypeChip } from "./ArchetypeChip";
import { OutreachBuilder } from "./OutreachBuilder";
import { stageLabel } from "./constants";
import type { StudentSummary, Status, GenerateOutreachFn } from "./types";

const STATUSES: Status[] = ["On Track", "At Risk", "High Priority"];
const STATUS_CLS: Record<Status, string> = {
  "On Track": "text-green border-green/40 bg-green/12",
  "At Risk": "text-yellow border-yellow/40 bg-yellow/12",
  "High Priority": "text-red border-red/40 bg-red/12",
};
const MOMENTUM: Record<string, { t: string; cls: string }> = {
  up: { t: "↑ Improving", cls: "text-green" },
  down: { t: "↓ Declining", cls: "text-red" },
  stable: { t: "→ Stable", cls: "text-muted" },
};
const ACTIVITY_LABELS: Record<string, string> = {
  job_viewed: "Viewed a job", job_saved: "Saved a job", job_applied: "Applied to a role",
  live_resume_created: "Created a Live Resume", resume_uploaded: "Uploaded a resume",
  snapshot_completed: "Completed Snapshot", stella_session: "Asked Stella a question",
  appointment_attended: "Attended appointment", profile_updated: "Updated profile",
};

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0][0] + p[1][0] : name.slice(0, 2)).toUpperCase();
}
function csvCell(v: string) {
  const t = String(v ?? "");
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export function StudentListView({
  students,
  year,
  status,
  generateOutreachDrafts,
}: {
  students: StudentSummary[];
  year: number;
  status: Status;
  generateOutreachDrafts: GenerateOutreachFn;
}) {
  const router = useRouter();
  const [nameQuery, setNameQuery] = useState("");
  const [majorFilter, setMajorFilter] = useState("");
  const [outreachOpen, setOutreachOpen] = useState(false);

  const majors = useMemo(
    () => Array.from(new Set(students.map((s) => s.major).filter(Boolean))) as string[],
    [students],
  );
  const filtered = students.filter((s) => {
    const nameOk = !nameQuery || (s.display_name ?? "").toLowerCase().includes(nameQuery.toLowerCase());
    const majorOk = !majorFilter || s.major === majorFilter;
    return nameOk && majorOk;
  });

  function exportCsv() {
    const header = ["Name", "Year", "Major", "Archetype", "Momentum", "Key Risk / Signal", "Recommended Next Step"];
    const rows = filtered.map((s) =>
      [
        s.display_name ?? s.student_guid, `Year ${year}`, s.major ?? "", s.archetype ?? "",
        MOMENTUM[s.momentum_direction]?.t ?? s.momentum_direction, s.primary_risk_factor ?? "", s.recommended_next_step ?? "",
      ].map(csvCell).join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `year-${year}-${status.replace(/\s+/g, "-").toLowerCase()}-students.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <Link href={`/advisor/crs/cohort/${year}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-fg">Year {year} — {stageLabel(year)} Stage</h1>
        <p className="mt-0.5 text-sm text-muted">Students by readiness status</p>
      </div>

      {/* Status switcher */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const active = s === status;
          return (
            <Link
              key={s}
              href={`/advisor/crs/cohort/${year}/students?status=${encodeURIComponent(s)}`}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                active ? STATUS_CLS[s] + " font-medium" : "border-border bg-chip text-muted hover:text-fg"
              }`}
            >
              {s}
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-1.5">
          <Search className="size-4 text-faint" />
          <input
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="Search students by name"
            className="w-56 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
          />
        </div>
        <select
          value={majorFilter}
          onChange={(e) => setMajorFilter(e.target.value)}
          className="rounded-lg border border-border bg-panel px-3 py-1.5 text-sm text-fg outline-none"
        >
          <option value="">All Majors</option>
          {majors.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button
          type="button"
          onClick={() => setOutreachOpen(true)}
          disabled={filtered.length === 0}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-indigo px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Sparkles className="size-4" /> Generate Outreach ({filtered.length})
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel-2 px-3 py-1.5 text-sm text-fg transition-colors hover:bg-hover"
        >
          <Download className="size-4" /> Export
        </button>
      </div>

      {outreachOpen && filtered.length > 0 && (
        <OutreachBuilder students={filtered} onClose={() => setOutreachOpen(false)} generateOutreachDrafts={generateOutreachDrafts} />
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-panel-2 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Student</th>
              <th className="px-4 py-2.5 font-medium">Major</th>
              <th className="px-4 py-2.5 font-medium">Archetype</th>
              <th className="px-4 py-2.5 font-medium">Momentum</th>
              <th className="px-4 py-2.5 font-medium">Last Activity</th>
              <th className="px-4 py-2.5 font-medium">Key Risk / Signal</th>
              <th className="px-4 py-2.5 font-medium">Recommended Next Step</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No students match.</td></tr>
            ) : filtered.map((s) => {
              const name = s.display_name ?? s.student_guid;
              const mo = MOMENTUM[s.momentum_direction] ?? { t: s.momentum_direction, cls: "text-muted" };
              return (
                <tr
                  key={s.student_guid}
                  onClick={() => router.push(`/advisor/crs/student/${s.student_guid}`)}
                  className="cursor-pointer transition-colors hover:bg-hover"
                >
                  <td className="px-4 py-2.5">
                    {/* Whole row navigates; the name stays a Link for keyboard access. */}
                    <Link
                      href={`/advisor/crs/student/${s.student_guid}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2.5 font-medium text-fg hover:text-indigo"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo/15 text-xs font-semibold text-indigo">{initials(name)}</span>
                      {name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{s.major ?? "—"}</td>
                  <td className="px-4 py-2.5"><ArchetypeChip archetype={s.archetype} /></td>
                  <td className={`px-4 py-2.5 font-medium ${mo.cls}`}>{mo.t}</td>
                  <td className="px-4 py-2.5">
                    <div className="text-fg">{s.last_activity_type ? ACTIVITY_LABELS[s.last_activity_type] ?? s.last_activity_type : "No recent activity"}</div>
                    <div className="text-xs text-muted">{s.last_activity_at ? new Date(s.last_activity_at).toLocaleDateString() : "—"}</div>
                  </td>
                  <td className="max-w-52 px-4 py-2.5">
                    {s.primary_risk_factor
                      ? <span className={s.status === "High Priority" ? "text-red" : "text-yellow"}>⚠ {s.primary_risk_factor}</span>
                      : s.status === "On Track"
                        ? <span className="text-green">✓ On track for milestones</span>
                        : <span className="text-faint">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{s.recommended_next_step ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">Showing {filtered.length} of {students.length} {status} students in Year {year}.</p>
    </div>
  );
}
