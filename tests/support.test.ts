import { describe, expect, it } from "vitest";
import {
  RAISE_OUTCOME_COPY,
  SUPPORT_EMAIL,
  supportMailto,
  supportReference,
} from "../src/support";

describe("the support@ line", () => {
  it("shows a reference only when there is one — never an invented one", () => {
    expect(supportReference("abc123")).toBe("abc123");
    expect(supportReference("  ")).toBeNull();
    expect(supportReference(undefined)).toBeNull();
  });
  it("builds a mailto with hub + reference in the subject and the facts in the body", () => {
    const m = supportMailto({ hub: "Talent Hub", reference: "ref9", route: "/employer/team" });
    expect(m.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`)).toBe(true);
    const url = new URL(m);
    expect(url.searchParams.get("subject")).toBe("Talent Hub · reference ref9");
    expect(url.searchParams.get("body")).toContain("Reference: ref9");
    expect(url.searchParams.get("body")).toContain("Where: /employer/team");
  });
  it("without a reference the subject says something went wrong", () => {
    const url = new URL(supportMailto({ hub: "Advisor Hub" }));
    expect(url.searchParams.get("subject")).toBe("Advisor Hub · something went wrong");
    expect(url.searchParams.get("body")).not.toContain("Reference:");
  });
});

describe("Raise Your Hand copy", () => {
  it("has a title and body for every outcome", () => {
    for (const k of ["resolved", "recorded", "already_known", "question_recorded"] as const) {
      expect(RAISE_OUTCOME_COPY[k].title).toBeTruthy();
      expect(RAISE_OUTCOME_COPY[k].body).toBeTruthy();
    }
  });
});
