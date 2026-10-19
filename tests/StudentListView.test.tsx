// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StudentListView } from "../src/crs/StudentListView";
import type { StudentSummary } from "../src/crs/types";

// Plain anchors that keep every prop (href, className, aria-current) so the assertions see them.
vi.mock("next/link", () => ({ default: (props: React.ComponentProps<"a">) => <a {...props} /> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(cleanup);

const STUDENTS: StudentSummary[] = [
  {
    student_guid: "s1",
    display_name: "Ada Lovelace",
    major: "Mathematics",
    status: "At Risk",
    archetype: "Scattered",
    engagement_play: null,
    momentum_direction: "stable",
    year_in_program: 2,
    last_activity_at: null,
    last_activity_type: null,
    primary_risk_factor: null,
    recommended_next_step: null,
  },
];
const drafts = async () => [];

/*
 * The status switcher is three links whose selected state was a background tint only. aria-current
 * tells a screen reader which status is showing, and the hubs' forced-colors CSS underlines
 * [aria-current] so the selection survives Windows high contrast (HECVAT 2026-10-18).
 */
describe("StudentListView status switcher", () => {
  it("marks the showing status link aria-current=page, and no other", () => {
    render(
      <StudentListView students={STUDENTS} year={2} status="At Risk" generateOutreachDrafts={drafts} basePath="/advisor/crs" />,
    );
    const current = screen.getByRole("link", { name: "At Risk", current: "page" });
    expect(current.getAttribute("href")).toContain("status=At%20Risk");
    for (const other of ["On Track", "High Priority"]) {
      expect(screen.getByRole("link", { name: other }).hasAttribute("aria-current")).toBe(false);
    }
  });
});
