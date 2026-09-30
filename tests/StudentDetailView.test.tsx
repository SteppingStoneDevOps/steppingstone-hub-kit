// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StudentDetailView } from "../src/crs/StudentDetailView";
import type { StudentDetail } from "../src/crs/types";

vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

afterEach(cleanup);

const GUID = "3f9c2b1a-77d4-4e0b-9a6e-0123456789ab";
const base: StudentDetail = {
  student_guid: GUID,
  display_name: null,
  major: "Marketing",
  program: null,
  year_in_program: 2,
  status: "At Risk",
  archetype: "Scattered",
  engagement_play: null,
  readiness_score: 51,
  momentum_direction: "stable",
  derived_features: null,
  milestones: [],
  risk_factors: [],
  activity_feed: [],
  recommended_next_steps: [],
  stella_insights: ["This student is spreading effort across too many fields."],
  last_updated: "2026-09-30T00:00:00Z",
};
const noop = async () => ({ reply: "", session_id: "" });
const drafts = async () => [];

/*
 * v0.15.0 (Advisor audit F-V11): the page says only what the record holds. A missing display name
 * used to put the GUID everywhere a first name goes; "Class of 20xx" was a demo map; nothing claims
 * an email is "on file".
 */
describe("StudentDetailView without a display name", () => {
  it("never shows the GUID where a name goes, and says 'this student' instead", () => {
    render(<StudentDetailView student={base} askStella={noop} generateOutreachDrafts={drafts} basePath="/advisor/crs" />);
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("3f9c2b1a-77d4"); // the full GUID never renders (the 8-char ID line is fine)
    expect(screen.getByText("Ask Stella about this student")).toBeTruthy();
    expect(screen.getByText("Send Email to this student")).toBeTruthy();
    expect(text).toContain("This student is spreading effort");
    expect(text).not.toMatch(/Class of/);
    expect(text).not.toMatch(/email on file/);
  });
  it("uses the first name when there is one", () => {
    render(<StudentDetailView student={{ ...base, display_name: "Jordan Blake" }} askStella={noop} generateOutreachDrafts={drafts} basePath="/advisor/crs" />);
    expect(screen.getByText("Ask Stella about Jordan")).toBeTruthy();
    expect(document.body.textContent).toContain("Jordan is spreading effort");
  });
});
