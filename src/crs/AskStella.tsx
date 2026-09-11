"use client";

import { useRef, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import type { Archetype, AskStellaFn } from "./types";

/**
 * "Ask Stella" — the CRS advisor co-pilot (Stella advising the ADVISOR about a student, grounded
 * in CRS data). Stella is the platform-wide AI brand; this advisor-facing surface ships in the
 * Advisor Hub. The conversation runs through the `askStella` server action — stubbed today with
 * archetype-aware replies, WIRE: Lynn for the live Gemini chat with session memory.
 *
 * Client island: it owns the panel + thread state so the student page stays a server component.
 */
type Msg = { role: "advisor" | "stella"; content: string };

const ARCHETYPE_PROMPTS: Record<string, string[]> = {
  "Going Dark": ["How do I re-engage them?", "Draft a check-in message"],
  "Confidence Gap": ["How do I get them to apply?", "Draft an encouragement message"],
  "Scattered": ["How do I help them focus?", "Suggest a field-narrowing exercise"],
  "Late Bloomer": ["How do I build on this momentum?", "What Foundation gaps matter most?"],
  "Dormant": ["How do I make first contact?", "Draft a welcome message"],
  "Front-Runner": ["What stretch goals fit?", "How do I keep them engaged?"],
  "Ascending": ["How do I fuel this momentum?", "What's the next challenge?"],
  "On Pace": ["How do I keep the cadence?", "What's one nudge this week?"],
};
const GENERIC_PROMPTS = ["What should I focus on?", "Draft an outreach message"];

export function AskStella({ studentGuid, firstName, archetype, askStella }: {
  studentGuid: string;
  firstName: string;
  archetype: Archetype | null;
  askStella: AskStellaFn;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const sessionId = useRef<string | undefined>(undefined);
  const opened = useRef(false);

  const prompts = (archetype && ARCHETYPE_PROMPTS[archetype]) || GENERIC_PROMPTS;

  async function open_() {
    setOpen(true);
    if (opened.current) return;
    opened.current = true;
    // Opening assessment (message = null), like the live contract.
    setPending(true);
    try {
      const res = await askStella(studentGuid, null, sessionId.current);
      sessionId.current = res.session_id;
      setMessages([{ role: "stella", content: res.reply }]);
    } finally {
      setPending(false);
    }
  }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || pending) return;
    setInput("");
    setMessages((m) => [...m, { role: "advisor", content: msg }]);
    setPending(true);
    try {
      const res = await askStella(studentGuid, msg, sessionId.current);
      sessionId.current = res.session_id;
      setMessages((m) => [...m, { role: "stella", content: res.reply }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {/* Trigger card (sidebar) */}
      <div className="rounded-xl border border-dark-indigo/40 bg-dark-indigo/10 p-4">
        <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-indigo">
          <Sparkles className="size-4" /> Ask Stella about {firstName}
        </div>
        <p className="text-xs leading-snug text-muted">
          Get personalized coaching and outreach recommendations, grounded in {firstName}&apos;s CRS signals.
        </p>
        <button
          type="button"
          onClick={open_}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Sparkles className="size-4" /> Ask Stella
        </button>
      </div>

      {/* Slide-in chat panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="flex h-full w-full max-w-md flex-col border-l border-border bg-panel shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-soft bg-panel-2 px-4 py-3">
              <div className="flex items-center gap-2 font-display font-semibold text-fg">
                <span className="flex size-7 items-center justify-center rounded-full bg-indigo/20 text-indigo"><Sparkles className="size-4" /></span>
                Ask Stella · {firstName}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-fg"><X className="size-5" /></button>
            </div>

            {/* Thread */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) =>
                m.role === "stella" ? (
                  <div key={i} className="flex gap-2">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo/20 text-indigo"><Sparkles className="size-3.5" /></span>
                    <div className="rounded-lg rounded-tl-sm border border-border bg-panel-2 px-3 py-2 text-sm text-fg">{m.content}</div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-indigo px-3 py-2 text-sm text-white">{m.content}</div>
                  </div>
                ),
              )}
              {pending && (
                <div className="flex gap-2 text-sm text-muted">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo/20 text-indigo"><Sparkles className="size-3.5" /></span>
                  <div className="rounded-lg border border-border bg-panel-2 px-3 py-2 italic">Stella is thinking…</div>
                </div>
              )}
            </div>

            {/* Quick replies */}
            {!pending && messages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-border-soft px-4 pt-3">
                {prompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-full border border-border bg-chip px-2.5 py-1 text-xs text-muted transition-colors hover:bg-hover hover:text-fg"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); void send(input); }}
              className="flex items-end gap-2 border-t border-border-soft px-4 py-3"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }}
                placeholder={`Ask about ${firstName}…`}
                rows={1}
                className="max-h-28 min-h-9 flex-1 resize-none rounded-lg border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-indigo"
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
            <p className="px-4 pb-2 text-center text-[11px] text-faint">Grounded in {firstName}&apos;s CRS data · Stella</p>
          </div>
        </div>
      )}
    </>
  );
}
