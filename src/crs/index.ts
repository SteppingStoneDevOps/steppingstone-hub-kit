// CRS (Career Readiness Signal) UI — shared source of truth, consumed by advisor-hub (and later
// admin-hub) via transpilePackages + @source. The action components (AskStella, OutreachBuilder,
// SendEmail) take their server actions as injected props (AskStellaFn / GenerateOutreachFn) — the
// server actions themselves stay in the host hub, not the package.
export * from "./types";
export * from "./archetypes";
export * from "./constants";
export * from "./insights";
export * from "./api";
export * from "./ArchetypeChip";
export * from "./PrintButton";
export * from "./ExecutiveOverviewView";
export * from "./YearOverviewView";
export * from "./StudentListView";
export * from "./StudentDetailView";
export * from "./AskStella";
export * from "./OutreachBuilder";
export * from "./SendEmail";

// `NarrativePoint` is declared in BOTH ./types (the public shape carried by InstitutionOverview,
// with `recommendation`) and ./insights (an internal {what, soWhat} used only inside that module).
// Both files are a pure move from advisor-hub; this explicit re-export resolves the star-export
// ambiguity in favor of the public ./types one (what advisor-hub always consumed).
export type { NarrativePoint } from "./types";
