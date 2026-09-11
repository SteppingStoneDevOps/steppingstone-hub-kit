"use client";

import { useState } from "react";
import { Sparkles, Megaphone, X, Download, Check } from "lucide-react";
import type { StudentSummary, Status, GenerateOutreachFn } from "./types";

/**
 * Bulk Outreach Builder — 3-step wizard (Select → Choose Type → Review & Export). Personalized
 * drafts come from Stella (server action, WIRE: Lynn); Broadcast is one templated message with a
 * [First Name] merge. Export CSV is live; platform Send is a Coming-Soon stub (auth-gated later).
 */
type OType = "personalized" | "broadcast";
const YEAR_ORDINAL: Record<number, string> = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };
const STATUS_CLS: Record<Status, string> = {
  "On Track": "text-green border-green/40 bg-green/12",
  "At Risk": "text-yellow border-yellow/40 bg-yellow/12",
  "High Priority": "text-red border-red/40 bg-red/12",
};
const DEFAULT_BROADCAST = {
  subject: "You're Invited: Career Readiness Workshop — This Thursday",
  body: `Hi [First Name],

We're hosting a Career Readiness Workshop this Thursday from 2:00–4:00 PM in the Career Services Center, and we'd love to see you there.

This hands-on session will cover:
  • Building a strong profile and resume for your year and major
  • Tailoring your experience to the roles you want
  • One-on-one time with a career advisor

Spots are limited, so please register early: [Registration Link]

We look forward to seeing you there.

[Advisor Name]
Career Services`,
};

function splitName(name: string) {
  const p = name.trim().split(/\s+/);
  return { first: p[0] ?? "", last: p.slice(1).join(" ") };
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0][0] + p[1][0] : name.slice(0, 2)).toUpperCase();
}
function csvCell(v: string) {
  const t = String(v ?? "");
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

function Badge({ status }: { status: Status }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLS[status]}`}>{status}</span>;
}
function Avatar({ name, size = "size-9" }: { name: string; size?: string }) {
  return <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-indigo/15 text-xs font-semibold text-indigo`}>{initials(name)}</span>;
}

export function OutreachBuilder({ students, onClose, generateOutreachDrafts }: { students: StudentSummary[]; onClose: () => void; generateOutreachDrafts: GenerateOutreachFn }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(students.map((s) => s.student_guid)));
  const [type, setType] = useState<OType | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { subject: string; body: string }>>({});
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftsError, setDraftsError] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState({ ...DEFAULT_BROADCAST });
  const [sendNote, setSendNote] = useState(false);

  const selectedStudents = students.filter((s) => selected.has(s.student_guid));

  const toggle = (g: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(g)) n.delete(g); else n.add(g);
      return n;
    });

  async function loadDrafts() {
    setDraftsLoading(true);
    setDraftsError(null);
    try {
      const res = await generateOutreachDrafts(selectedStudents.map((s) => s.student_guid));
      const map: Record<string, { subject: string; body: string }> = {};
      res.forEach((d) => { map[d.student_guid] = { subject: d.subject, body: d.body }; });
      setDrafts(map);
    } catch (e) {
      setDraftsError(String(e));
    } finally {
      setDraftsLoading(false);
    }
  }

  function chooseType(t: OType) {
    setType(t);
    setStep(3);
    if (t === "personalized" && Object.keys(drafts).length === 0) void loadDrafts();
  }
  function goBack() {
    setSendNote(false);
    if (step === 3) { setStep(2); setType(null); }
    else if (step === 2) setStep(1);
  }

  function exportCsv() {
    const headers = ["first_name", "last_name", "email", "year", "major", "status", "subject_line", "message_body"];
    const rows = selectedStudents.map((s) => {
      const { first, last } = splitName(s.display_name ?? s.student_guid);
      let subj = "", body = "";
      if (type === "personalized") { const d = drafts[s.student_guid]; subj = d?.subject ?? ""; body = d?.body ?? ""; }
      else { subj = broadcast.subject; body = broadcast.body.replace(/\[First Name\]/g, first); }
      return [first, last, "", String(s.year_in_program), s.major ?? "", s.status, subj, body];
    });
    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type ?? "outreach"}_outreach.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const meta = (s: StudentSummary) => `${YEAR_ORDINAL[s.year_in_program] ?? `Year ${s.year_in_program}`}${s.major ? ` · ${s.major}` : ""}`;
  const setDraft = (g: string, patch: Partial<{ subject: string; body: string }>) =>
    setDrafts((p) => {
      const cur = p[g] ?? { subject: "", body: "" };
      return { ...p, [g]: { ...cur, ...patch } };
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-panel shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
          <div className="flex items-center gap-2 font-display font-semibold text-fg">
            <Sparkles className="size-5 text-indigo" /> Generate Student Outreach
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-fg"><X className="size-5" /></button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 border-b border-border-soft px-5 py-3 text-sm">
          {[[1, "Select Students"], [2, "Choose Type"], [3, "Review & Export"]].map(([n, label], i) => (
            <div key={n} className="flex items-center gap-2">
              <span className={`flex size-5 items-center justify-center rounded-full text-xs font-semibold ${
                step === n ? "bg-indigo text-white" : step > (n as number) ? "bg-green/20 text-green" : "bg-chip text-muted"
              }`}>{step > (n as number) ? "✓" : n}</span>
              <span className={step === n ? "text-fg" : "text-muted"}>{label}</span>
              {i < 2 && <span className="text-faint">›</span>}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div>
              <div className="mb-2 flex items-center gap-3 text-sm">
                <button type="button" onClick={() => setSelected(new Set(students.map((s) => s.student_guid)))} className="rounded-lg border border-border bg-chip px-2.5 py-1 text-fg hover:bg-hover">Select All</button>
                <button type="button" onClick={() => setSelected(new Set())} className="rounded-lg border border-border bg-chip px-2.5 py-1 text-fg hover:bg-hover">Clear</button>
                <span className="text-muted">{selected.size} of {students.length} selected</span>
              </div>
              <div className="divide-y divide-border-soft rounded-lg border border-border">
                {students.map((s) => {
                  const name = s.display_name ?? s.student_guid;
                  const on = selected.has(s.student_guid);
                  return (
                    <label key={s.student_guid} className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${on ? "bg-hover" : "hover:bg-hover"}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(s.student_guid)} className="size-4 accent-indigo" />
                      <Avatar name={name} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-fg">{name}</div>
                        <div className="text-xs text-muted">{meta(s)}</div>
                      </div>
                      <Badge status={s.status} />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-1 text-sm text-fg">How would you like to reach {selected.size} student{selected.size !== 1 ? "s" : ""}?</div>
              <p className="mb-4 text-sm text-muted">Stella can personalize a message per student, or you can broadcast one message to all.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => chooseType("personalized")} className="rounded-xl border border-border bg-panel-2 p-4 text-left transition-colors hover:bg-hover">
                  <Sparkles className="mb-2 size-6 text-indigo" />
                  <div className="font-medium text-fg">Personalized</div>
                  <p className="mt-1 text-xs text-muted">Stella drafts a unique message for each student from their risk signals, year, and stage. Higher engagement.</p>
                </button>
                <button type="button" onClick={() => chooseType("broadcast")} className="rounded-xl border border-border bg-panel-2 p-4 text-left transition-colors hover:bg-hover">
                  <Megaphone className="mb-2 size-6 text-brand" />
                  <div className="font-medium text-fg">Broadcast</div>
                  <p className="mt-1 text-xs text-muted">One message to every selected student. Ideal for workshops, events, deadlines, and invitations.</p>
                </button>
              </div>
            </div>
          )}

          {step === 3 && type === "personalized" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-dark-indigo/40 bg-dark-indigo/8 px-3 py-2 text-sm text-muted">
                <Sparkles className="size-4 shrink-0 text-indigo" /> Stella drafted a message per student. Review and edit before exporting.
              </div>
              {draftsLoading && <div className="py-6 text-center text-sm text-muted">✦ Stella is drafting {selectedStudents.length} messages…</div>}
              {draftsError && <div className="py-3 text-sm text-red">Failed to draft: {draftsError}</div>}
              {!draftsLoading && !draftsError && selectedStudents.map((s) => {
                const name = s.display_name ?? s.student_guid;
                const d = drafts[s.student_guid] ?? { subject: "", body: "" };
                return (
                  <div key={s.student_guid} className="rounded-lg border border-border bg-panel-2 p-3">
                    <div className="mb-2 flex items-center gap-2.5">
                      <Avatar name={name} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-fg">{name}</div>
                        <div className="text-xs text-muted">{meta(s)}</div>
                      </div>
                      <Badge status={s.status} />
                    </div>
                    <Field label="Subject"><input value={d.subject} onChange={(e) => setDraft(s.student_guid, { subject: e.target.value })} className={inputCls} /></Field>
                    <Field label="Message"><textarea value={d.body} onChange={(e) => setDraft(s.student_guid, { body: e.target.value })} className={`${inputCls} min-h-32`} /></Field>
                  </div>
                );
              })}
            </div>
          )}

          {step === 3 && type === "broadcast" && (
            <div>
              <p className="mb-3 text-sm text-muted">One message to all {selectedStudents.length} students. <span className="text-fg">[First Name]</span> is replaced per student on export.</p>
              <Field label="Subject Line"><input value={broadcast.subject} onChange={(e) => setBroadcast((b) => ({ ...b, subject: e.target.value }))} className={inputCls} /></Field>
              <Field label="Message"><textarea value={broadcast.body} onChange={(e) => setBroadcast((b) => ({ ...b, body: e.target.value }))} className={`${inputCls} min-h-52`} /></Field>
              <div className="mb-2 mt-4 text-sm font-semibold text-fg">Recipients — {selectedStudents.length}</div>
              <div className="divide-y divide-border-soft rounded-lg border border-border">
                {selectedStudents.map((s) => {
                  const name = s.display_name ?? s.student_guid;
                  return (
                    <div key={s.student_guid} className="flex items-center gap-2.5 px-3 py-2">
                      <Check className="size-4 shrink-0 text-green" />
                      <Avatar name={name} size="size-7" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-fg">{name}</div>
                        <div className="text-xs text-muted">{meta(s)}</div>
                      </div>
                      <Badge status={s.status} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border-soft px-5 py-3">
          <div className="text-sm text-muted">
            {sendNote ? <span className="font-medium text-indigo">Platform send is coming soon — use Export CSV for now.</span>
              : step === 1 ? "Adjust the selection, then continue."
              : step === 2 ? "Choose a type above."
              : type === "personalized" ? `✦ ${selectedStudents.length} personalized message${selectedStudents.length !== 1 ? "s" : ""}`
              : `📢 1 broadcast · ${selectedStudents.length} recipients`}
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && <button type="button" onClick={goBack} className="rounded-lg border border-border bg-chip px-3 py-1.5 text-sm text-fg hover:bg-hover">← Back</button>}
            {step === 1 && <button type="button" disabled={selected.size === 0} onClick={() => setStep(2)} className="rounded-lg bg-indigo px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40">Next →</button>}
            {step === 3 && <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel-2 px-3 py-1.5 text-sm text-fg hover:bg-hover"><Download className="size-4" /> Export CSV</button>}
            {step === 3 && <button type="button" onClick={() => setSendNote(true)} className="rounded-lg bg-indigo px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">Send</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-indigo";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="mb-1 text-xs font-medium text-muted">{label}</div>
      {children}
    </div>
  );
}
