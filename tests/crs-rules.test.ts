import { describe, expect, it } from "vitest";
import { deriveInstitutionNarrative } from "../src/crs/insights";
import { ARCHETYPE_META } from "../src/crs/archetypes";
import type { Archetype, CohortSummary, InstitutionOverview } from "../src/crs/types";

const cohort = (year: number, on_track_pct: number, momentum: CohortSummary["momentum"]): CohortSummary => ({
  year,
  stage: `Stage ${year}`,
  total: 100,
  on_track_pct,
  at_risk_pct: 100 - on_track_pct - 10,
  high_priority_pct: 10,
  on_track_count: on_track_pct,
  at_risk_count: 100 - on_track_pct - 10,
  high_priority_count: 10,
  momentum,
});

const overview: InstitutionOverview = {
  institution_id: "u1",
  total_students: 400,
  on_track_count: 260,
  at_risk_count: 100,
  high_priority_count: 40,
  on_track_pct: 65,
  at_risk_pct: 25,
  high_priority_pct: 10,
  trend_12mo: [],
  cohorts: [cohort(1, 50, "down"), cohort(2, 70, "up"), cohort(3, 80, "stable"), cohort(4, 60, "up")],
  working: [],
  concerns: [],
  last_updated: "2026-09-30T00:00:00Z",
};

describe("deriveInstitutionNarrative — rule-derived, no bands, no opinions", () => {
  const { working, concerns } = deriveInstitutionNarrative(overview);
  it("names the strongest cohort, the rising ones, and the campus-wide majority", () => {
    expect(working[0].what).toContain("Year 3");
    expect(working[0].what).toContain("80%");
    expect(working.some((p) => p.what.includes("Year 2, Year 4"))).toBe(true);
    expect(working.some((p) => p.what.includes("260 of 400"))).toBe(true);
  });
  it("names the weakest cohort with its below-On-Track count, the High Priority slice, and the decline", () => {
    expect(concerns[0].what).toContain("Year 1");
    expect(concerns[0].what).toContain("50 students below On Track");
    expect(concerns.some((p) => p.what.includes("40 students (10%) are High Priority"))).toBe(true);
    expect(concerns.some((p) => p.what.includes("declining in Year 1"))).toBe(true);
  });
  it("never uses a strength band word (removed 2026-09-24)", () => {
    const all = [...working, ...concerns].flatMap((p) => [p.what, p.soWhat]).join(" ");
    expect(all).not.toMatch(/\b(Strong|Good|Average|Weak)\b/);
  });
  it("a single cohort yields no weakest-vs-strongest concern", () => {
    const one = { ...overview, cohorts: [cohort(1, 50, "stable")], high_priority_count: 0 };
    expect(deriveInstitutionNarrative(one).concerns).toEqual([]);
  });
});

describe("ARCHETYPE_META", () => {
  it("covers all eight archetypes with a definition and an intervention", () => {
    const all: Archetype[] = ["Going Dark", "Confidence Gap", "Scattered", "Late Bloomer", "Dormant", "Front-Runner", "Ascending", "On Pace"];
    for (const a of all) {
      expect(ARCHETYPE_META[a].definition.length).toBeGreaterThan(10);
      expect(ARCHETYPE_META[a].intervention.length).toBeGreaterThan(5);
    }
  });
});
