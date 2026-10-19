// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { YearOverviewView } from "../src/crs/YearOverviewView";
import type { CohortSummary } from "../src/crs/types";

vi.mock("next/link", () => ({ default: (props: React.ComponentProps<"a">) => <a {...props} /> }));

afterEach(cleanup);

const COHORT = {
  year: 2,
  stage: "Exploration",
  total: 10,
  on_track_pct: 50,
  at_risk_pct: 30,
  high_priority_pct: 20,
  on_track_count: 5,
  at_risk_count: 3,
  high_priority_count: 2,
  momentum: "stable",
} as CohortSummary;

/*
 * WCAG 1.4.10 Reflow (v0.22.1): Advisor's 320px scan found this header 13px wider than the
 * viewport, the title and the Raise Your Hand slot side by side with no way to wrap. jsdom has no
 * layout, so this pins the classes that let it wrap: the row wraps, the title block may shrink
 * below its longest word, and the title breaks long words.
 */
describe("YearOverviewView header", () => {
  it("wraps the title and the action instead of overflowing", () => {
    render(
      <YearOverviewView cohort={COHORT} basePath="/advisor/crs" raiseHand={() => <button type="button">Raise Your Hand</button>} />,
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    const block = h1.parentElement!;
    const row = block.parentElement!;
    expect(row.className).toMatch(/(^|\s)flex-wrap(\s|$)/);
    expect(block.className).toMatch(/(^|\s)min-w-0(\s|$)/);
    expect(h1.className).toMatch(/(^|\s)break-words(\s|$)/);
    expect(row.contains(screen.getByRole("button", { name: "Raise Your Hand" }))).toBe(true);
  });
});
