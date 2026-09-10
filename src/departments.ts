/*
 * Academic departments — the global catalog + the validation rules a university's own
 * tailored list must satisfy.
 *
 * TWO things (Lynn's model):
 *  - The GLOBAL catalog below — Lynn's `academic_department_catalog` (39 rows, seeded in
 *    steppingstone-platform migration `d7b482e1c930`). A fixed reference/template; a
 *    university NEVER edits it.
 *  - Each university's OWN list (`AcademicDepartment`, org-scoped `academic_department`),
 *    SEEDED from this catalog at university creation, then tailored: trim, add
 *    (create-new or pick-from-catalog), and edit name+code in place. Isolated per org.
 *
 * The manager UI (University Admin Settings; mirrored in the Admin Hub) edits the
 * university's copy only. WIRE: Lynn -> the catalog read + the org-scoped CRUD already
 * exist (`GET/POST /internships/academic-departments`, `PUT/DELETE …/{id}`); the seam in
 * `lib/data.ts` swaps mock for those.
 */

/** One global-catalog entry: display name + a short code. */
export interface DepartmentCatalogEntry {
  name: string;
  code: string;
}

/**
 * The 39 global departments (name, code), verbatim from the platform catalog seed. The
 * start-from template each university's list is seeded from. Codes are 2–4 letters.
 */
export const ACADEMIC_DEPARTMENT_CATALOG: readonly DepartmentCatalogEntry[] = [
  { name: "Accounting", code: "ACCT" },
  { name: "Agriculture", code: "AGRI" },
  { name: "Architecture", code: "ARCH" },
  { name: "Art & Design", code: "ART" },
  { name: "Biology", code: "BIOL" },
  { name: "Business", code: "BUS" },
  { name: "Chemistry", code: "CHEM" },
  { name: "Communication", code: "COMM" },
  { name: "Computer Science", code: "CS" },
  { name: "Criminal Justice", code: "CJ" },
  { name: "Data Science", code: "DATA" },
  { name: "Economics", code: "ECON" },
  { name: "Education", code: "EDU" },
  { name: "Engineering", code: "ENGR" },
  { name: "English", code: "ENGL" },
  { name: "Environmental Science", code: "ENVS" },
  { name: "Finance", code: "FIN" },
  { name: "Health Sciences", code: "HLTH" },
  { name: "History", code: "HIST" },
  { name: "Hospitality", code: "HOSP" },
  { name: "Human Resources", code: "HR" },
  { name: "Information Technology", code: "IT" },
  { name: "Journalism", code: "JOUR" },
  { name: "Kinesiology", code: "KINE" },
  { name: "Law", code: "LAW" },
  { name: "Management", code: "MGMT" },
  { name: "Marketing", code: "MKTG" },
  { name: "Mathematics", code: "MATH" },
  { name: "Music", code: "MUS" },
  { name: "Nursing", code: "NURS" },
  { name: "Philosophy", code: "PHIL" },
  { name: "Physics", code: "PHYS" },
  { name: "Political Science", code: "POLS" },
  { name: "Psychology", code: "PSYC" },
  { name: "Public Health", code: "PUBH" },
  { name: "Social Work", code: "SOCW" },
  { name: "Sociology", code: "SOC" },
  { name: "Supply Chain", code: "SCM" },
  { name: "Theatre", code: "THTR" },
] as const;

/** Department code rule: 2–4 uppercase letters (matches the catalog's ACCT / CS / ART style). */
export const DEPARTMENT_CODE_RE = /^[A-Z]{2,4}$/;

/** True when `code` is 2–4 uppercase letters. Trims first; does NOT upcase (the form does that). */
export function isValidDepartmentCode(code: string): boolean {
  return DEPARTMENT_CODE_RE.test(code.trim());
}

/** Normalize for case-insensitive, whitespace-insensitive comparison. */
const norm = (s: string): string => s.trim().toLowerCase();

/**
 * Which field (if any) collides with an existing department in the same university —
 * name or code, case-insensitive. Pass `excludeId` when editing so a row doesn't clash
 * with itself. Returns the first conflicting field, or null when the candidate is unique.
 * Uniqueness is per-university (the caller passes that university's list); the server
 * enforces the same on write (WIRE: Lynn -> add the name-uniqueness constraint too).
 */
export function departmentConflict(
  existing: readonly { id?: string; name: string; code: string }[],
  candidate: { name: string; code: string },
  excludeId?: string,
): "name" | "code" | null {
  const n = norm(candidate.name);
  const c = norm(candidate.code);
  for (const d of existing) {
    if (excludeId && d.id === excludeId) continue;
    if (norm(d.name) === n) return "name";
    if (norm(d.code) === c) return "code";
  }
  return null;
}
