import type { ReactNode } from "react";

/**
 * The interim support channel: a plain mailto to the monitored inbox, launched ONLY from the error
 * boundaries. It is deliberately not a form that posts through the platform — the root and global
 * boundaries render precisely when the hub could not reach the backend, so the one channel that
 * works there is the person's own mail app. Inside a working shell this line is a stand-in until
 * "Raise Your Hand" (advisor-hub/docs/support-spec/07) takes those placements; the root and global
 * screens keep it for good. No global Help entry, per that spec (D2). Shared here (hub-kit v0.8.0)
 * so the wording and the mailto shape change once for every hub.
 */
export const SUPPORT_EMAIL = "support@mysteppingstone.ai";

/**
 * The reference shown on screen and carried in the email subject. In production Next.js hands the
 * boundary only a `digest` — the same value it writes beside the real error in the server log —
 * so this code is what lets a support email land on the exact log line. Absent (a client-side
 * throw carries none) → no reference is shown rather than an invented one.
 */
export function supportReference(digest: string | null | undefined): string | null {
  const d = (digest ?? "").trim();
  return d === "" ? null : d;
}

/**
 * The mailto the support line opens. Subject = hub + reference so the inbox can be sorted without
 * opening anything; body = the facts the person should not have to know to type (reference, route;
 * the message's own timestamp says when) and one prompt for what they were doing. Never a name, never session data — the reference
 * is the join key to everything else.
 */
export function supportMailto(input: {
  hub: string;
  reference?: string | null;
  route?: string | null;
}): string {
  const ref = supportReference(input.reference);
  const subject = ref ? `${input.hub} · reference ${ref}` : `${input.hub} · something went wrong`;
  const lines = [
    ref ? `Reference: ${ref}` : null,
    input.route ? `Where: ${input.route}` : null,
    "",
    "What I was doing:",
    "",
  ].filter((l): l is string => l !== null);
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

/* ── "Raise Your Hand" ──────────────────────────────────────────────────────────────────────
 *
 * The in-product support intake (advisor-hub/docs/support-spec/07). Distinct from the mailto
 * above: that one is the last resort on a screen that could not reach the backend; this one runs
 * inside a working shell and files a real record. Deliberately NOT Stella-branded (D1) — Stella in
 * the Advisor Hub is the CRS co-pilot, and support intake is its own thing.
 *
 * The types and copy live here, beside the mailto, so both hubs render one vocabulary and the
 * wording changes in one place.
 */

/** The fork in step one (D5). `complaint` and `question` are the platform's own words. */
export type RaiseKind = "complaint" | "question";

/**
 * What came back, as one of the four step-three outcomes. `resolved` is the configuration probe
 * answering on the spot; `already_known` is an open defect matching the action key. Both of those
 * keep the escape hatch (D6) — a confident answer is the worst response to a real defect.
 */
export type RaiseOutcome =
  | { outcome: "resolved"; explanation: string }
  | { outcome: "recorded"; issueId?: string }
  | { outcome: "already_known"; summary: string; status: string }
  | { outcome: "question_recorded"; issueId?: string };

/** The control's label (D4). Addressed to the person, and it covers both paths. */
export const RAISE_LABEL = "Raise Your Hand";

/** Step one, the only judgement the person has to make. */
export const RAISE_FORK: { kind: RaiseKind; title: string; description: string }[] = [
  {
    kind: "complaint",
    title: "Something is broken",
    description: "It does not work, or what it is showing looks wrong.",
  },
  {
    kind: "question",
    title: "I have a question about how this works",
    description: "The behaviour may be correct; you want to understand it.",
  },
];

/** Step two. No subhead under the field, per the platform rule — the placeholder carries it. */
export const RAISE_PLACEHOLDER: Record<RaiseKind, string> = {
  complaint: "What were you trying to do, and what happened instead?",
  question: "What would you like to understand?",
};

/**
 * Step three. `title` heads the outcome, `body` follows it. The resolved case appends the probe's
 * own sentence rather than one written here: it names the configuration fact, and only the server
 * knows it.
 */
export const RAISE_OUTCOME_COPY: Record<RaiseOutcome["outcome"], { title: string; body: string }> = {
  resolved: {
    title: "That explains it",
    body: "Nothing has been filed, because nothing appears to be broken.",
  },
  recorded: {
    title: "Thank you — that is recorded",
    body: "Nobody else has reported this yet. Someone is looking at it now.",
  },
  already_known: {
    title: "We already know about this one",
    body: "Your report has been added to it.",
  },
  question_recorded: {
    title: "Thank you — that is recorded",
    body:
      "This goes to the team as a question, not as a fault report, so it is not counted toward a defect.",
  },
};

/** The escape hatch (D6). Without it we have rebuilt the knowledge base. */
export const RAISE_ESCAPE_LABEL = "That is not what I meant";

/**
 * How a shared view receives the hub's "Raise Your Hand" control: a render prop taking the
 * placement's action key. The CRS views are ONE piece of code mounted by both the Advisor Hub and
 * the Admin Hub, and each owns its own submit and session, so the control is handed in rather than
 * constructed — exactly as `askStella` and `generateOutreachDrafts` already are. Omitted, nothing
 * renders, and the view is unchanged for a consumer that has not adopted the surface.
 */
export type RaiseHandSlot = (actionKey: string) => ReactNode;
