import { describe, expect, it } from "vitest";
import {
  courseKey,
  newCourses,
  parseCourseRows,
  parseCourseRowsDetailed,
  partitionByDepartment,
  resolveCourseIds,
  splitCourseCode,
} from "../src/courses";

/*
 * The course-catalog rules every hub's add and bulk-upload path relies on. A course is its
 * department code + a 3-digit number (Eric's rule, both enforced); anything else is skipped and
 * REPORTED, never imported half-formed (audit F-A11).
 */

describe("splitCourseCode", () => {
  it("accepts 2–4 letters + 3 digits, with or without a space, uppercasing the code", () => {
    expect(splitCourseCode("MKTG450")).toEqual({ code: "MKTG", number: "450" });
    expect(splitCourseCode(" cs 101 ")).toEqual({ code: "CS", number: "101" });
  });
  it("rejects anything else", () => {
    for (const bad of ["Marketing", "450", "MKTG45", "MKTG4500", "MARKETING450", "MKTG 450L", "H201"]) {
      expect(splitCourseCode(bad)).toBeNull();
    }
  });
});

describe("parseCourseRowsDetailed", () => {
  it("reads three-column, two-column split and two-column legacy rows, dropping a header", () => {
    const text = [
      "Department, Course Number, Title",
      "MKTG, 450, Marketing Research",
      '"ACCT", "ACCT 300", "Intermediate Accounting, Part I"',
      "CS, 101",
      "ENGR201, Statics",
      "",
    ].join("\n");
    const { courses, skipped } = parseCourseRowsDetailed(text);
    expect(courses).toEqual([
      { code: "MKTG", number: "450", title: "Marketing Research" },
      { code: "ACCT", number: "300", title: "Intermediate Accounting, Part I" },
      { code: "CS", number: "101", title: "" },
      { code: "ENGR", number: "201", title: "Statics" },
    ]);
    expect(skipped).toEqual([]);
  });

  it("skips and REPORTS rows without a 3-digit number — never imports them half-formed", () => {
    const { courses, skipped } = parseCourseRowsDetailed("BIOL, 450L, Lab\nHIST, H201, Honors\nMATH, 120, Algebra");
    expect(courses).toEqual([{ code: "MATH", number: "120", title: "Algebra" }]);
    expect(skipped).toEqual(["BIOL, 450L, Lab", "HIST, H201, Honors"]);
  });

  it("splits on tabs too (pasted spreadsheet cells)", () => {
    expect(parseCourseRows("PSYC\t101\tIntro")).toEqual([{ code: "PSYC", number: "101", title: "Intro" }]);
  });
});

describe("courseKey / newCourses / partitionByDepartment", () => {
  it("keys are case- and whitespace-insensitive", () => {
    expect(courseKey({ code: " MKTG", number: "450 " })).toBe(courseKey({ code: "mktg", number: "450" }));
  });
  it("newCourses drops what exists and de-dupes the upload against itself, first-seen order", () => {
    const fresh = newCourses(
      [{ code: "MKTG", number: "450" }],
      [
        { code: "mktg", number: "450", title: "dup of existing" },
        { code: "CS", number: "101", title: "a" },
        { code: "CS", number: "101", title: "b" },
        { code: "ACCT", number: "300", title: "c" },
      ],
    );
    expect(fresh.map((c) => `${c.code} ${c.number}`)).toEqual(["CS 101", "ACCT 300"]);
  });
  it("partitions by managed department and lists unknown codes sorted", () => {
    const r = partitionByDepartment(
      [
        { code: "MKTG", number: "450", title: "" },
        { code: "ZZZ", number: "100", title: "" },
        { code: "ABC", number: "100", title: "" },
      ],
      ["mktg"],
    );
    expect(r.known).toHaveLength(1);
    expect(r.unknown).toHaveLength(2);
    expect(r.unknownCodes).toEqual(["ABC", "ZZZ"]);
  });
});

describe("resolveCourseIds", () => {
  it("maps names to ids, drops unknowns and blanks, keeps order", () => {
    const catalog = [{ id: "1", name: "MKTG 450" }, { id: "2", name: "CS 101" }];
    expect(resolveCourseIds(["CS 101", "", "Nope", "MKTG 450"], catalog)).toEqual(["2", "1"]);
  });
});
