"use client";

import { useState } from "react";
import { Mail, X, Sparkles, Copy } from "lucide-react";
import type { GenerateOutreachFn } from "./types";

/**
 * 1:1 Send Email — direct compose at the student level. Staff write a message (or have Stella
 * draft one), copy it, and send. Platform Send is a Coming-Soon stub (auth-gated later). Client
 * island: it owns the modal + form state so the student page stays a server component.
 */
export function SendEmail({ studentGuid, firstName, generateOutreachDrafts }: { studentGuid: string; firstName: string; generateOutreachDrafts: GenerateOutreachFn }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendNote, setSendNote] = useState(false);

  async function draftWithStella() {
    setDrafting(true);
    setSendNote(false);
    try {
      const [d] = await generateOutreachDrafts([studentGuid]);
      if (d) { setSubject(d.subject); setBody(d.body); }
    } finally {
      setDrafting(false);
    }
  }
  function copy() {
    void navigator.clipboard?.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setSendNote(false);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-panel-2 px-3 py-2 text-sm font-medium text-fg transition-colors hover:bg-hover"
      >
        <Mail className="size-4" /> Send Email to {firstName}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl border border-border bg-panel shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
              <div className="flex items-center gap-2 font-display font-semibold text-fg">
                <Mail className="size-5 text-indigo" /> Send Email to {firstName}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-fg"><X className="size-5" /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-muted">To <span className="font-medium text-fg">{firstName}</span> · email on file</div>
                <button type="button" onClick={draftWithStella} disabled={drafting} className="inline-flex items-center gap-1.5 rounded-lg border border-dark-indigo/40 bg-dark-indigo/10 px-2.5 py-1 text-sm font-medium text-indigo hover:opacity-90 disabled:opacity-50">
                  <Sparkles className="size-4" /> {drafting ? "Drafting…" : "Draft with Stella"}
                </button>
              </div>
              <div className="mb-1 text-xs font-medium text-muted">Subject</div>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" className="mb-3 w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-indigo" />
              <div className="mb-1 text-xs font-medium text-muted">Message</div>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message, or have Stella draft one…" className="min-h-48 w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-indigo" />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border-soft px-5 py-3">
              <div className="text-sm text-muted">
                {copied ? <span className="font-medium text-green">Copied to clipboard</span>
                  : sendNote ? <span className="font-medium text-indigo">Platform send is coming soon — copy the message for now.</span>
                  : "Compose a message, or have Stella draft one."}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-chip px-3 py-1.5 text-sm text-fg hover:bg-hover"><Copy className="size-4" /> Copy</button>
                <button type="button" onClick={() => setSendNote(true)} className="rounded-lg bg-indigo px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
