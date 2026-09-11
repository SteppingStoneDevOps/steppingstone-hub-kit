/**
 * CRS (Career Readiness Signal) types — provisional, ported from the standalone CRS UI
 * (mss-crs/dashboard/src/api/types.ts) as CRS is folded into the Advisor Hub.
 *
 * These describe the CRS backend's read shapes (institution overview, cohort/student lists,
 * student detail). The CRS backend stays standalone; the Hub reads it through the `lib/data.ts`
 * seam. Not in `schema.ts` (that's the platform OpenAPI) — CRS has its own API. Reconcile with
 * generated types if/when the CRS reads are proxied behind headless. WIRE: Lynn.
 *
 * NOTE (product decisions, 2026-08-23): readiness is a DISTRIBUTION, not a single score. The
 * per-student `readiness_score` is retained here because the backend returns it and it derives
 * `status`, but it is NEVER displayed in the UI — screens lead with status + archetype.
 */

export type Status = "On Track" | "At Risk" | "High Priority";
export type Momentum = "up" | "down" | "stable";
export type MilestoneState = "complete" | "in_progress" | "not_started";

export type Archetype =
  | "Going Dark" | "Confidence Gap" | "Scattered" | "Late Bloomer" | "Dormant"
  | "Front-Runner" | "Ascending" | "On Pace";

export interface TrendPoint {
  month: string;
  on_track_pct: number;
}

export interface CohortSummary {
  year: number;
  stage: string;
  total: number;
  on_track_pct: number;
  at_risk_pct: number;
  high_priority_pct: number;
  on_track_count: number;
  at_risk_count: number;
  high_priority_count: number;
  momentum: Momentum;
  /** SteppingStone readiness-standard band label, computed by the service (Strong/Good/…). */
  strength_band: string | null;
}

/**
 * A "What's Working / Areas of Concern" point. `what` (fact) + `soWhat` (significance) are
 * rule-derived by the service; `recommendation` is the optional Stella "Now What" for that point.
 */
export interface NarrativePoint {
  what: string;
  soWhat: string;
  recommendation: string | null;
}

export interface InstitutionOverview {
  institution_id: string;
  total_students: number;
  on_track_count: number;
  at_risk_count: number;
  high_priority_count: number;
  on_track_pct: number;
  at_risk_pct: number;
  high_priority_pct: number;
  trend_12mo: TrendPoint[];
  cohorts: CohortSummary[];
  /** Rule-derived narrative from the service (was FE-derived off-live). */
  working: NarrativePoint[];
  concerns: NarrativePoint[];
  last_updated: string;
}

export interface MomentumTrend {
  last_30: number;
  prior_30: number;
  ratio: number;
  direction: "declining" | "flat" | "rising" | "spiking";
}

export interface FieldConvergence {
  converged: boolean;
  scattered: boolean;
  dominant_field: string | null;
  field_distribution: Record<string, number>;
}

export interface StellaTierTrajectory {
  direction: "deepening" | "flat" | "declining";
  avg_tier: number;
}

export interface DerivedFeatures {
  momentum_trend: MomentumTrend;
  field_convergence: FieldConvergence;
  stella_tier_trajectory: StellaTierTrajectory;
}

export interface StudentSummary {
  student_guid: string;
  display_name: string | null;
  major: string | null;
  status: Status;
  archetype: Archetype | null;
  engagement_play: string | null;
  momentum_direction: Momentum;
  year_in_program: number;
  last_activity_at: string | null;
  last_activity_type: string | null;
  primary_risk_factor: string | null;
  recommended_next_step: string | null;
}

export interface StudentListResponse {
  total: number;
  page: number;
  per_page: number;
  students: StudentSummary[];
}

export interface OutreachDraft {
  student_guid: string;
  display_name: string | null;
  archetype: string | null;
  subject: string;
  body: string;
}

/**
 * Action callbacks the host hub injects into the CRS action components (the components live in
 * the shared package; the server actions that back them cannot). The advisor-hub passes its own
 * `askStella` / `generateOutreachDrafts` server actions as these props.
 */
export type AskStellaFn = (studentGuid: string, message: string | null, sessionId?: string) => Promise<{ reply: string; session_id: string }>;
export type GenerateOutreachFn = (guids: string[]) => Promise<OutreachDraft[]>;

export interface DimensionScore {
  score: number;
  signal_count: number;
  recency_score: number;
}

export interface Milestone {
  label: string;
  state: MilestoneState;
  year_required: number;
}

export interface RiskFactor {
  severity: "warning" | "info";
  description: string;
}

export interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
}

export interface StudentDetail {
  student_guid: string;
  display_name: string | null;
  major: string | null;
  program: string | null;
  year_in_program: number;
  status: Status;
  archetype: Archetype | null;
  engagement_play: string | null;
  /** Internal — derives status; never displayed (readiness is a distribution, not a score). */
  readiness_score: number;
  /** Which scoring config produced the score — stamped by the service. Internal; for a future
   *  trend view (a trend spanning a calibration change must not compare two rulers as one). */
  scoring_config_version?: string | null;
  momentum_direction: Momentum;
  derived_features: DerivedFeatures | null;
  milestones: Milestone[];
  risk_factors: RiskFactor[];
  activity_feed: ActivityItem[];
  recommended_next_steps: string[];
  stella_insights: string[];
  last_updated: string;
}
