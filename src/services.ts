/*
 * Advisory-service display helpers — pure, unit-testable.
 *
 * The backend sends camelCase names (`AcademicAdvising`) and empty description fields, so
 * the FE prettifies the name for display and supplies a short blurb per known service.
 * Unknown/new services still render (prettified name, no blurb). Keyed on the
 * space-insensitive lowercased name so a `AcademicAdvising` → `Academic Advising` rename
 * upstream stays covered.
 */

/** "AcademicAdvising" → "Academic Advising"; an already-spaced name passes through. */
export function prettifyServiceName(raw: string): string {
  return raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  academicadvising: "Course selection, degree progress, academic planning.",
  careerservices: "Resumes, interviews, job & internship search.",
  tutoring: "Subject-specific tutoring tied to the course catalog.",
};

/** Short blurb for a service by name (prettified or raw); "" when we don't have one. */
export function serviceDescription(name: string): string {
  return SERVICE_DESCRIPTIONS[name.replace(/\s+/g, "").toLowerCase()] ?? "";
}
