import type { InstitutionOverview, CohortSummary } from "./types";

/**
 * CRS rules layer — the deterministic "What" + "So What" for the Executive Overview narrative.
 * Per the 2026-08-23 decision, facts and their significance are RULE-DERIVED (never AI-authored);
 * only the "Now What" recommendation is generated. This module is that rule layer.
 *
 * ⚠ Two generated things sit on that screen and they are labelled differently (Eric, 2026-09-17):
 * the per-point recommendation (block 3A) is UNATTRIBUTED, while the Stella's Reading panel beside
 * it is attributed. This comment used to call the recommendation Stella's; it is not.
 */

/**
 * THE STRENGTH BANDS WERE REMOVED (Eric, 2026-09-24) — do not reintroduce them casually.
 *
 * `Strong / Good / Average / Weak` and their 75 / 60 / 50 cutoffs used to label every cohort here,
 * colour its bar, and appear in two narrative sentences. They are gone, along with the colour that
 * encoded them: a bar painted red at 47% is the same verdict as the word "Weak", so removing the
 * label while keeping the colour would have hidden the judgement rather than withdrawn it.
 *
 * The reason is that it is too early to grade a university. The cutoffs were a first guess, we have
 * no real distribution to calibrate them against, and a school reading "Weak" on its own dashboard
 * off the back of a guess is a conversation not worth having. The PERCENTAGES stay — they are facts.
 * Bands come back when there is real data to set them from, and they will need a deliberate decision
 * about the numbers, not a restoration of these.
 */

export interface NarrativePoint {
  what: string;    // the fact (rule-derived)
  soWhat: string;  // the significance (rule-derived — ranking / threshold, never opinion)
}

/**
 * Derive the "What's Working" and "Areas of Concern" points from the live distribution.
 * Deterministic: rankings, threshold comparisons, and momentum — no fabricated numbers,
 * no peer references (peer benchmarking is deferred, FR-1).
 */
export function deriveInstitutionNarrative(o: InstitutionOverview): {
  working: NarrativePoint[];
  concerns: NarrativePoint[];
} {
  const byOnTrack = [...o.cohorts].sort((a, b) => b.on_track_pct - a.on_track_pct);
  const strongest = byOnTrack[0];
  const weakest = byOnTrack[byOnTrack.length - 1];
  const rising = o.cohorts.filter((c) => c.momentum === "up");
  const declining = o.cohorts.filter((c) => c.momentum === "down");
  const label = (c: CohortSummary) => `Year ${c.year} (${c.stage})`;

  const working: NarrativePoint[] = [];
  if (strongest) {
    working.push({
      what: `${label(strongest)} leads at ${strongest.on_track_pct}% On Track.`,
      soWhat: `The highest On Track share of any year.`,
    });
  }
  if (rising.length) {
    working.push({
      what: `Momentum is rising in ${rising.map((c) => `Year ${c.year}`).join(", ")}.`,
      soWhat: "These cohorts are trending up over the last 30 days.",
    });
  }
  if (o.on_track_pct >= 60) {
    working.push({
      what: `${o.on_track_count} of ${o.total_students} students (${o.on_track_pct}%) are On Track overall.`,
      soWhat: `A majority of students campus-wide are On Track.`,
    });
  }

  const concerns: NarrativePoint[] = [];
  if (weakest && weakest !== strongest) {
    const below = weakest.at_risk_count + weakest.high_priority_count;
    concerns.push({
      what: `${label(weakest)} is at ${weakest.on_track_pct}% On Track — ${below} students below On Track.`,
      soWhat: `The largest drag on campus readiness and the single biggest lever for improvement.`,
    });
  }
  if (o.high_priority_count > 0) {
    concerns.push({
      what: `${o.high_priority_count} students (${o.high_priority_pct}%) are High Priority.`,
      soWhat: "Immediate advisor intervention — the most urgent slice of the distribution.",
    });
  }
  if (declining.length) {
    concerns.push({
      what: `Momentum is declining in ${declining.map((c) => `Year ${c.year}`).join(", ")}.`,
      soWhat: "Engagement is slipping over the last 30 days in these cohorts.",
    });
  }
  return { working, concerns };
}
