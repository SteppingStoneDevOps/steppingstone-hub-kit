import type { InstitutionOverview, CohortSummary } from "./types";

/**
 * CRS rules layer — the deterministic "What" + "So What" for the Executive Overview narrative.
 * Per the 2026-08-23 decision, facts and their significance are RULE-DERIVED (never AI-authored);
 * only the "Now What" recommendation is Stella/AI. This module is that rule layer.
 */

/**
 * The SteppingStone readiness STANDARD — a single global scale, not per-university.
 * WIRE: Lynn — breakpoints move to SS-Admin-tunable global config; do not make per-school.
 */
export type BandLabel = "Strong" | "Good" | "Average" | "Weak";
const BANDS: { label: BandLabel; min: number; range: string; cls: string }[] = [
  { label: "Strong", min: 75, range: "75%+", cls: "text-green" },
  { label: "Good", min: 60, range: "60–74%", cls: "text-green" },
  { label: "Average", min: 50, range: "50–59%", cls: "text-yellow" },
  { label: "Weak", min: 0, range: "≤ 49%", cls: "text-red" },
];

export function strengthBand(onTrackPct: number): { label: BandLabel; range: string; cls: string } {
  return BANDS.find((b) => onTrackPct >= b.min) ?? BANDS[BANDS.length - 1];
}

export const BAND_LEGEND = BANDS.map((b) => ({ label: b.label, range: b.range, cls: b.cls }));

/** Color class for a strength-band LABEL (the service returns the label; the FE maps it to color). */
export function bandClass(label: string | null | undefined): string {
  return BANDS.find((b) => b.label === label)?.cls ?? "text-muted";
}

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
      soWhat: `The strongest cohort — ${strengthBand(strongest.on_track_pct).label} on the readiness standard.`,
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
      soWhat: `Campus-wide readiness sits in the ${strengthBand(o.on_track_pct).label} band.`,
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
