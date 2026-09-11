import type { Archetype } from "./types";

/**
 * Behavioral-archetype metadata for the CRS chip (definition + what-to-do + a display tone).
 * Ported from the CRS scoring framework (8 archetypes, two phases: flags first, healthy tiers).
 * `tone` maps to Hub token colors in ArchetypeChip. Definitions/interventions are advisor-facing.
 */
export type ArchetypeTone = "danger" | "warn" | "info" | "good" | "neutral";

export const ARCHETYPE_META: Record<Archetype, {
  tone: ArchetypeTone;
  definition: string;
  intervention: string;
}> = {
  // Phase 1 — flags (fire regardless of status)
  "Going Dark": {
    tone: "danger",
    definition: "Momentum declining from a meaningful base; outcomes not advancing.",
    intervention: "Re-engage now — the window is closing.",
  },
  "Confidence Gap": {
    tone: "warn",
    definition: "Foundation and momentum high and converging, but outcomes near zero.",
    intervention: "Stella coaching → push the first application.",
  },
  "Scattered": {
    tone: "warn",
    definition: "Mid/high momentum with low field convergence and low outcomes.",
    intervention: "Run a field-narrowing exercise to find focus.",
  },
  "Late Bloomer": {
    tone: "info",
    definition: "Foundation gap, momentum spiking after a quiet period, outcomes emerging.",
    intervention: "Encourage the activation and fast-track Foundation.",
  },
  "Dormant": {
    tone: "danger",
    definition: "No activity, no Foundation, no prior momentum.",
    intervention: "Direct outreach — offer the lowest-friction re-entry.",
  },
  // Phase 2 — healthy tiers (only if no flag fired)
  "Front-Runner": {
    tone: "good",
    definition: "All dimensions high, outcomes ahead of the year norm, converged.",
    intervention: "Stretch — reach goals and peer mentoring.",
  },
  "Ascending": {
    tone: "good",
    definition: "Dimensions mid→high, momentum rising, outcomes emerging→present, converged.",
    intervention: "Fuel momentum — feed the next challenge.",
  },
  "On Pace": {
    tone: "neutral",
    definition: "Dimensions at the year norm, momentum flat, converged (the healthy floor).",
    intervention: "Light touch — reinforce the cadence.",
  },
};
