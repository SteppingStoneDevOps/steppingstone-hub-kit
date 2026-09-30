import { describe, expect, it } from "vitest";
import {
  ACADEMIC_DEPARTMENT_CATALOG,
  departmentConflict,
  isValidDepartmentCode,
} from "../src/departments";

describe("department code rule", () => {
  it("is 2–4 uppercase letters; trims but does not upcase", () => {
    expect(isValidDepartmentCode(" ACCT ")).toBe(true);
    expect(isValidDepartmentCode("CS")).toBe(true);
    expect(isValidDepartmentCode("acct")).toBe(false);
    expect(isValidDepartmentCode("A")).toBe(false);
    expect(isValidDepartmentCode("ACCTG")).toBe(false);
  });
  it("every catalog entry satisfies the rule and codes are unique", () => {
    const codes = ACADEMIC_DEPARTMENT_CATALOG.map((d) => d.code);
    expect(codes.every(isValidDepartmentCode)).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
    expect(ACADEMIC_DEPARTMENT_CATALOG).toHaveLength(39);
  });
});

describe("departmentConflict", () => {
  const existing = [
    { id: "a", name: "Accounting", code: "ACCT" },
    { id: "b", name: "Marketing", code: "MKTG" },
  ];
  it("reports a name or code collision case-insensitively", () => {
    expect(departmentConflict(existing, { name: "accounting ", code: "XX" })).toBe("name");
    expect(departmentConflict(existing, { name: "New", code: "mktg" })).toBe("code");
    expect(departmentConflict(existing, { name: "New", code: "NEW" })).toBeNull();
  });
  it("lets a row being edited keep its own name and code", () => {
    expect(departmentConflict(existing, { name: "Accounting", code: "ACCT" }, "a")).toBeNull();
    expect(departmentConflict(existing, { name: "Accounting", code: "ACCT" }, "b")).toBe("name");
  });
});
