/**
 * Headless CRS API shapes (`headless/api/routers/crs.py`) + mappers to our FE types. The seam
 * (`lib/data.ts`) reads these and hands the FE types to screens — the one place the wire shape is
 * known. Key renames the router does: the scoring store is guid-only, so `student_guid`→`student_id`
 * and names are joined from member records server-side (`display_name`→`name`). `year_in_program`
 * is optional (a missing year must never become a claim of "freshman"). WIRE: Lynn (headless routes).
 */
import type {
  Archetype,
  ActivityItem,
  CohortSummary,
  InstitutionOverview,
  Milestone,
  MilestoneState,
  Momentum,
  NarrativePoint,
  OutreachDraft,
  RiskFactor,
  Status,
  StudentDetail,
  StudentSummary,
} from "./types";

// ── Wire shapes (mirror the headless Pydantic models) ────────────────────────
export interface ApiNarrativePoint { kind?: string | null; fact?: string | null; significance?: string | null; recommendation?: string | null }
export interface ApiCohortSummary {
  year?: number | null; stage?: string | null; total?: number;
  on_track_count?: number; at_risk_count?: number; high_priority_count?: number;
  on_track_pct?: number; at_risk_pct?: number; high_priority_pct?: number;
  momentum?: string | null; strength_band?: string | null;
}
export interface ApiInstitutionOverview {
  total_students?: number; on_track_count?: number; at_risk_count?: number; high_priority_count?: number;
  on_track_pct?: number; at_risk_pct?: number; high_priority_pct?: number;
  cohorts?: ApiCohortSummary[]; trend?: unknown[]; last_updated?: string | null;
  working?: ApiNarrativePoint[]; concerns?: ApiNarrativePoint[];
}
export interface ApiStudentSummary {
  student_id: string; name?: string | null; major?: string | null; status?: string | null;
  archetype?: string | null; engagement_play?: string | null; momentum_direction?: string | null;
  year_in_program?: number | null; last_activity_at?: string | null; last_activity_type?: string | null;
  primary_risk_factor?: string | null; recommended_next_step?: string | null;
}
export interface ApiCohortPage { total?: number; page?: number; per_page?: number; students?: ApiStudentSummary[] }
export interface ApiStudentDetail {
  student_id: string; name?: string | null; major?: string | null; program?: string | null; status?: string | null;
  archetype?: string | null; engagement_play?: string | null; momentum_direction?: string | null; year_in_program?: number | null;
  overall_score?: number | null; scoring_config_version?: string | null; dimension_scores?: Record<string, unknown>; derived_features?: Record<string, unknown>;
  risk_factors?: Record<string, unknown>[]; milestones?: Record<string, unknown>[];
  recommended_steps?: string[]; activity?: Record<string, unknown>[]; insight?: string | null; last_updated?: string | null;
}
export interface ApiStellaReply { session_id?: string | null; message?: string | null; quick_replies?: string[] }
export interface ApiInstitutionInsight { insight?: string | null; generated_at?: string | null }
export interface ApiOutreachDraft { student_id: string; name?: string | null; subject?: string | null; body?: string | null }

// ── Mappers (Api → FE) ───────────────────────────────────────────────────────
const asStatus = (s?: string | null): Status => (s === "On Track" || s === "At Risk" || s === "High Priority" ? s : "At Risk");
const asMomentum = (m?: string | null): Momentum => (m === "up" || m === "down" || m === "stable" ? m : "stable");
const asArchetype = (a?: string | null): Archetype | null => (a ? (a as Archetype) : null);

export function toCohortSummary(c: ApiCohortSummary): CohortSummary {
  return {
    year: c.year ?? 0,
    stage: c.stage ?? "",
    total: c.total ?? 0,
    on_track_pct: c.on_track_pct ?? 0,
    at_risk_pct: c.at_risk_pct ?? 0,
    high_priority_pct: c.high_priority_pct ?? 0,
    on_track_count: c.on_track_count ?? 0,
    at_risk_count: c.at_risk_count ?? 0,
    high_priority_count: c.high_priority_count ?? 0,
    momentum: asMomentum(c.momentum),
    strength_band: c.strength_band ?? null,
  };
}

const toNarrativePoint = (p: ApiNarrativePoint): NarrativePoint => ({
  what: p.fact ?? "",
  soWhat: p.significance ?? "",
  recommendation: p.recommendation ?? null,
});

export function toInstitutionOverview(o: ApiInstitutionOverview): InstitutionOverview {
  return {
    institution_id: "", // the caller's org; never a parameter (headless derives it)
    total_students: o.total_students ?? 0,
    on_track_count: o.on_track_count ?? 0,
    at_risk_count: o.at_risk_count ?? 0,
    high_priority_count: o.high_priority_count ?? 0,
    on_track_pct: o.on_track_pct ?? 0,
    at_risk_pct: o.at_risk_pct ?? 0,
    high_priority_pct: o.high_priority_pct ?? 0,
    trend_12mo: [], // trend is parked (no fabricated history); ignore o.trend for now
    cohorts: (o.cohorts ?? []).map(toCohortSummary),
    working: (o.working ?? []).map(toNarrativePoint),
    concerns: (o.concerns ?? []).map(toNarrativePoint),
    last_updated: o.last_updated ?? "",
  };
}

export function toStudentSummary(s: ApiStudentSummary): StudentSummary {
  return {
    student_guid: s.student_id,
    display_name: s.name ?? null,
    major: s.major ?? null,
    status: asStatus(s.status),
    archetype: asArchetype(s.archetype),
    engagement_play: s.engagement_play ?? null,
    momentum_direction: asMomentum(s.momentum_direction),
    year_in_program: s.year_in_program ?? 0,
    last_activity_at: s.last_activity_at ?? null,
    last_activity_type: s.last_activity_type ?? null,
    primary_risk_factor: s.primary_risk_factor ?? null,
    recommended_next_step: s.recommended_next_step ?? null,
  };
}

export function toStudentDetail(d: ApiStudentDetail): StudentDetail {
  return {
    student_guid: d.student_id,
    display_name: d.name ?? null,
    major: d.major ?? null,
    program: d.program ?? null,
    year_in_program: d.year_in_program ?? 0,
    status: asStatus(d.status),
    archetype: asArchetype(d.archetype),
    engagement_play: d.engagement_play ?? null,
    readiness_score: d.overall_score ?? 0, // internal; never displayed
    scoring_config_version: d.scoring_config_version ?? null, // which config produced the score (future trend boundaries)
    momentum_direction: asMomentum(d.momentum_direction), // detail now carries momentum (matches the list)
    derived_features: null,
    milestones: (d.milestones ?? []).map((m): Milestone => ({
      label: String(m.label ?? ""),
      state: (m.state as MilestoneState) ?? "not_started",
      year_required: Number(m.year_required ?? 0),
    })),
    risk_factors: (d.risk_factors ?? []).map((r): RiskFactor => ({
      severity: r.severity === "warning" ? "warning" : "info",
      description: String(r.description ?? ""),
    })),
    activity_feed: (d.activity ?? []).map((a): ActivityItem => ({
      type: String(a.type ?? ""),
      description: String(a.description ?? ""),
      timestamp: String(a.timestamp ?? ""),
    })),
    recommended_next_steps: d.recommended_steps ?? [],
    stella_insights: d.insight ? [d.insight] : [],
    last_updated: d.last_updated ?? "",
  };
}

export function toOutreachDraft(o: ApiOutreachDraft): OutreachDraft {
  return {
    student_guid: o.student_id,
    display_name: o.name ?? null,
    archetype: null, // headless outreach draft carries no archetype
    subject: o.subject ?? "",
    body: o.body ?? "",
  };
}
