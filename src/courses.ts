/**
 * Course-catalog helpers — parsing a pasted / uploaded course list into department-anchored
 * courses, and de-duping them. A course is identified by its **department code + number**
 * (e.g. MKTG 450); the department is the same `academic_department_id` faculty/dept-heads are
 * assigned to and that internship routing joins on — so a course resolves its approvers with
 * no prefix-guessing (it replaces the Student Hub's hardcoded `deptForCourse` stub). Kept pure
 * + framework-free so it's unit-tested (`courses.test.ts`) and shared by the individual-add and
 * bulk-upload paths in `CourseCatalog`.
 */

/** A parsed course row: a department code (course prefix), a number, and an optional title. */
export interface CourseInput {
  /** Department code / course prefix, uppercased — e.g. "MKTG". Matched to a managed department. */
  code: string;
  /** Course number — e.g. "450" (may carry a trailing letter, "450L"). */
  number: string;
  /** Human title — e.g. "Marketing Research". Optional; blank is allowed. */
  title: string;
}

/**
 * A course's identity — its (department code, number) pair, case-insensitive. Used to de-dupe
 * an upload against the existing catalog AND against itself, and matches the idempotency key we
 * asked the platform to upsert on.
 */
export function courseKey(c: Pick<CourseInput, "code" | "number">): string {
  return `${c.code.trim().toLowerCase()} ${c.number.trim().toLowerCase()}`;
}

/**
 * Resolve course display NAMES (the Tutor picker toggles by name) to `course_id` FKs for the advisor
 * write, against the university course catalog. A name that matches nothing is DROPPED rather than
 * guessed; blanks are ignored; order is preserved. Pure — loading the catalog stays with the caller.
 */
export function resolveCourseIds(
  names: string[],
  catalog: ReadonlyArray<{ id: string; name: string }>,
): string[] {
  const idByName = new Map(catalog.map((c) => [c.name, c.id]));
  return names
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => idByName.get(n))
    .filter((id): id is string => Boolean(id));
}

/**
 * Split a course code like "MKTG450" or "MKTG 450" into { code, number }. Convention (Eric):
 * a **2–4 letter** department code followed by a **3-digit** course number — the same code the
 * managed departments use, so a parsed course resolves straight to its `academic_department_id`.
 */
export function splitCourseCode(
  raw: string,
): { code: string; number: string } | null {
  const m = raw.trim().match(/^([A-Za-z]{2,4})\s*([0-9]{3})$/);
  if (!m) return null;
  return { code: m[1].toUpperCase(), number: m[2] };
}

/** A valid course number: exactly three digits — the convention the add-course form and
 *  `splitCourseCode` both enforce, so every intake path agrees. */
function isCourseNumber(n: string): boolean {
  return /^[0-9]{3}$/.test(n.trim());
}

/**
 * Parse pasted or uploaded rows into department-anchored courses. Accepts two shapes, one per line:
 *   • THREE columns — `Department, Course Number, Title` (the natural registrar/CSV shape, matching
 *     the department-anchored model): e.g. `MKTG, 450, Marketing Research`. A course number that
 *     redundantly repeats the department prefix (`MKTG 450`) is stripped to the bare number.
 *   • TWO columns — `Course Code, Title` (legacy): e.g. `MKTG450, Marketing Research`, `MKTG 450,
 *     Senior Capstone`, or just `CSCI 499`.
 * Deliberately forgiving: trims whitespace, ignores blank lines, strips surrounding quotes, drops a
 * header row, and keeps commas inside a title (only the leading columns are split off). A row we
 * can't resolve to a department code + number is skipped rather than imported half-formed.
 */
export function parseCourseRows(text: string): CourseInput[] {
  const out: CourseInput[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (isHeaderRow(line)) continue;

    // THREE-column: first cell is an alpha-only department code and there are 3+ cells.
    const three = splitLimit(line, 3);
    if (three.length === 3 && /^[A-Za-z]{2,}$/.test(three[0])) {
      const code = three[0].toUpperCase();
      const number = stripDeptPrefix(three[1], code);
      if (!isCourseNumber(number)) continue; // must be a 3-digit course number (like every other path)
      out.push({ code, number, title: three[2].trim() });
      continue;
    }

    const two = splitLimit(line, 2);

    // TWO-column, SPLIT department + number: `Department, Course Number` (title optional/empty),
    // e.g. `MKTG, 450`. A valid row that neither branch handled before — the dept and number are in
    // separate cells, so the combined-code path below can't parse `MKTG` alone.
    if (two.length === 2 && /^[A-Za-z]{2,}$/.test(two[0])) {
      const code = two[0].toUpperCase();
      const number = stripDeptPrefix(two[1], code);
      if (isCourseNumber(number)) {
        out.push({ code, number, title: "" });
        continue;
      }
    }

    // TWO-column legacy: first cell is a combined "PREFIX###" code.
    const parsed = splitCourseCode(two[0]);
    if (!parsed) continue; // need a real "PREFIX###" code
    out.push({ code: parsed.code, number: parsed.number, title: (two[1] ?? "").trim() });
  }
  return out;
}

/**
 * Split a line into at most `max` cells on comma/tab; the FINAL cell keeps any remaining
 * separators, so a title may contain commas. Each returned cell is trimmed + unquoted.
 */
function splitLimit(line: string, max: number): string[] {
  const out: string[] = [];
  let rest = line;
  while (out.length < max - 1) {
    const i = firstSeparator(rest);
    if (i === -1) break;
    out.push(rest.slice(0, i));
    rest = rest.slice(i + 1);
  }
  out.push(rest);
  return out.map(unquote);
}

/** A leading header row, e.g. "Department, Course Number, Course Name" or "Course, Title". */
function isHeaderRow(line: string): boolean {
  const first = unquote(splitLimit(line, 2)[0]).toLowerCase();
  return /^(departments?|dept\.?|subjects?|courses?|course\s*(codes?|numbers?|names?|titles?)|codes?|numbers?|names?|titles?)$/.test(
    first,
  );
}

/** Drop a department prefix a course number sometimes repeats — "MKTG 450" (dept MKTG) → "450". */
function stripDeptPrefix(numberCell: string, code: string): string {
  return numberCell
    .trim()
    .replace(new RegExp(`^${code}\\s*`, "i"), "")
    .trim();
}

/** Index of the first column separator — comma or tab (so pasted spreadsheet cells work too). */
function firstSeparator(line: string): number {
  const comma = line.indexOf(",");
  const tab = line.indexOf("\t");
  if (comma === -1) return tab;
  if (tab === -1) return comma;
  return Math.min(comma, tab);
}

function unquote(s: string): string {
  return s.trim().replace(/^"(.*)"$/, "$1").trim();
}

/**
 * Filter `incoming` down to the courses not already present (by `courseKey`), de-duping
 * within `incoming` too. Returns the fresh courses in first-seen order — what a bulk add
 * would actually create.
 */
export function newCourses(
  existing: readonly Pick<CourseInput, "code" | "number">[],
  incoming: readonly CourseInput[],
): CourseInput[] {
  const seen = new Set(existing.map(courseKey));
  const fresh: CourseInput[] = [];
  for (const c of incoming) {
    const k = courseKey(c);
    if (seen.has(k)) continue;
    seen.add(k);
    fresh.push(c);
  }
  return fresh;
}

/**
 * Partition parsed courses by whether their department code matches one of the university's
 * managed departments (case-insensitive). Courses under an unknown code are NOT silently
 * created — a course whose department has no faculty/dept-head would dead-end an internship
 * request at the approver step, so the UI surfaces `unknownCodes` for the admin to resolve
 * (add the department + assign approvers, or fix the code) rather than importing them blind.
 */
export function partitionByDepartment(
  incoming: readonly CourseInput[],
  departmentCodes: readonly string[],
): { known: CourseInput[]; unknown: CourseInput[]; unknownCodes: string[] } {
  const codes = new Set(departmentCodes.map((c) => c.trim().toLowerCase()));
  const known: CourseInput[] = [];
  const unknown: CourseInput[] = [];
  const unknownCodes = new Set<string>();
  for (const c of incoming) {
    if (codes.has(c.code.trim().toLowerCase())) known.push(c);
    else {
      unknown.push(c);
      unknownCodes.add(c.code.toUpperCase());
    }
  }
  return { known, unknown, unknownCodes: [...unknownCodes].sort() };
}
