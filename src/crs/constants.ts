/**
 * CRS presentation constants. Stage labels are the SteppingStone defaults; per-school overrides
 * are a config the Hub will read at go-live (SS Admin + University Admin set them). WIRE: Lynn.
 */
export const STAGE_LABELS = ["Design", "Build", "Experience", "Launch"] as const;

export const STAGE_DESC: Record<number, string> = {
  1: "building their foundation — exploring interests, completing their profile, and connecting with advisors.",
  2: "preparing to compete — building a resume, gaining experience, and positioning for internships.",
  3: "building real-world credentials — securing an internship, completing interviews, and developing professional connections before Year 4.",
  4: "in the final approach — converting applications and interviews into offers before graduation.",
};

export function stageLabel(year: number): string {
  return STAGE_LABELS[year - 1] ?? `Year ${year}`;
}

export const YEAR_ORDINAL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
