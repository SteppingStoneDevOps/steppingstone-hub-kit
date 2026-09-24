/**
 * The interim support channel: a plain mailto to the monitored inbox, launched ONLY from the error
 * boundaries. It is deliberately not a form that posts through the platform — the root and global
 * boundaries render precisely when the hub could not reach the backend, so the one channel that
 * works there is the person's own mail app. Inside a working shell this line is a stand-in until
 * "Raise your hand" (advisor-hub/docs/support-spec/07) takes those placements; the root and global
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
