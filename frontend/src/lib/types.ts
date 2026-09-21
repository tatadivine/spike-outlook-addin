// Mirrors backend/app/schemas/domain.py field-for-field. This is the API
// contract — if the backend schema changes, this file changes with it,
// deliberately, not by accident.

export type AccountType = "employee" | "administrator";
export type PrivilegeLevel = "standard" | "team_lead" | "manager";
export type Role = "employee" | "team_lead" | "manager" | "administrator";

export type Department =
  | "Sales"
  | "Operations"
  | "Finance"
  | "Engineering"
  | "Customer Success"
  | "Marketing"
  | "HR";

export interface Employee {
  id: string;
  name: string;
  title: string;
  department: Department;
  manager_id: string | null;
  email: string;
  avatar_color: string;
  response_score: number;
  median_response_minutes: number;
  answered_within_24h_pct: number;
  positive_communication_pct: number;
  overdue_follow_ups: number;
  open_commitments: number;
  sla_compliance_pct: number;
}

export type CommClassification = "customer" | "vendor" | "internal";
export type ResponseStatus = "needs_response" | "waiting" | "completed" | "overdue";
export type Priority = "low" | "normal" | "high" | "critical";
export type AIReviewStatus = "pending" | "confirmed" | "dismissed" | "needs_context";

export interface TimelineEvent {
  id: string;
  label: string;
  timestamp: string;
  actor: string;
}

export interface AIFinding {
  id: string;
  response_required: boolean;
  priority: Priority;
  ownership: string;
  commitment_detected: boolean;
  due_date: string | null;
  next_action: string;
  quality_score: number;
  confidence_pct: number;
  review_status: AIReviewStatus;
  reasoning: string;
}

export interface Communication {
  id: string;
  contact: string;
  organization: string;
  category: CommClassification;
  subject: string;
  body_preview: string;
  received_at: string;
  responded_at: string | null;
  response_time_minutes: number | null;
  status: ResponseStatus;
  priority: Priority;
  owner_id: string;
  next_step: string;
  quality_score: number;
  ai_finding: AIFinding | null;
  timeline: TimelineEvent[];
  excluded: boolean;
  exclusion_reason?: string | null;
}

export type CommitmentStatus = "active" | "due_today" | "due_this_week" | "overdue" | "completed";

export interface Commitment {
  id: string;
  title: string;
  source: string;
  owner_id: string;
  created_at: string;
  due_date: string;
  status: CommitmentStatus;
  days_overdue: number;
  next_action: string;
}

export type FollowUpStatus = "open" | "overdue" | "due_today" | "completed" | "escalated";

export interface FollowUp {
  id: string;
  contact: string;
  subject: string;
  owner_id: string;
  due_date: string;
  status: FollowUpStatus;
  last_activity: string;
  next_action: string;
}

export type AlertCategory =
  | "needs_response"
  | "overdue"
  | "commitment"
  | "follow_up"
  | "ai_coaching"
  | "positive_indicator";
export type AlertSeverity = "low" | "medium" | "high";

export interface AlertItem {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  time: string;
  source: string;
  reason: string;
  recommended_action: string;
  owner_id: string;
}

export type CustomerHealth = "strong" | "steady" | "at_risk";

export interface Customer {
  id: string;
  name: string;
  industry: string;
  open_communications: number;
  avg_response_minutes: number;
  outstanding_commitments: number;
  follow_ups: number;
  health: CustomerHealth;
}

export type ReviewStatus = "pending_review" | "confirmed" | "dismissed" | "needs_context";

export interface Review {
  id: string;
  employee_id: string;
  finding: string;
  evidence: string;
  ai_confidence_pct: number;
  status: ReviewStatus;
  reviewer: string | null;
  date: string;
  communication_id: string;
}

export type EvidenceResult = "confirmed" | "excluded" | "under_review";

export interface Evidence {
  id: string;
  finding: string;
  source: string;
  date: string;
  rule: string;
  evidence_text: string;
  context: string | null;
  result: EvidenceResult;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  result: "success" | "denied";
  ip: string;
}

export type InsightKind = "strength" | "improve" | "follow_through" | "response" | "positive";

export interface AIInsight {
  id: string;
  employee_id: string;
  kind: InsightKind;
  headline: string;
  why: string;
  evidence: string;
  confidence_pct: number;
  review_status: "unreviewed" | "reviewed";
}

// --- Dashboard -------------------------------------------------------------

export interface MetricStat {
  label: string;
  value: number;
  suffix?: string | null;
  trend: "up" | "down" | "flat";
  trend_label: string;
  progress_pct: number;
  source?: string | null;
}

export interface TrendWeek {
  label: string;
  employee: number;
  team: number;
}

export interface ReviewPoint {
  title: string;
  desc: string;
}

export interface PerformanceReviewSummary {
  overall_label: string;
  delta_points: number;
  filled_dots: number;
  total_dots: number;
  strengths: ReviewPoint[];
  coaching: ReviewPoint[];
}

export interface CommitmentRow {
  category: string;
  within_sla_pct: number;
  within_sla_numerator: number;
  within_sla_denominator: number;
  overdue: number;
  trend: "up" | "down" | "flat";
  bold?: boolean;
}

export interface QualityMeter {
  label: string;
  sub: string;
  pct: number;
  color: string;
}

export interface DashboardEvidenceItem {
  id: string;
  title: string;
  date: string;
  quote: string;
  tag: string;
  positive: boolean;
  ai_note?: string | null;
}

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  subject: string;
  from: string;
  preview: string;
  meta: string;
  action: string;
}

export interface ExcludedMessage {
  subject: string;
  from: string;
  reason: string;
}

export interface DashboardView {
  scope_label: string;
  scope_subtitle: string;
  metrics: MetricStat[];
  overdue_open: number;
  trend: TrendWeek[];
  weeks_above_goal: string;
  review_summary: PerformanceReviewSummary;
  commitment_rows: CommitmentRow[];
  quality_meters: QualityMeter[];
  evidence_items: DashboardEvidenceItem[];
  alerts: DashboardAlert[];
  excluded_messages: ExcludedMessage[];
}

export interface RosterEmployee {
  id: string;
  name: string;
  title: string;
  department: Department;
  avatar_color: string;
  response_score: number;
  overdue_follow_ups: number;
}

export interface ScoringRule {
  id: string;
  label: string;
  value: string;
}

export interface ExclusionRule {
  id: string;
  label: string;
  description: string;
  rule: string;
  enabled: boolean;
}

export interface IntegrationStatus {
  name: string;
  status: "connected" | "not_configured" | "mock_mode" | "error";
  description: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; request_id?: string };
}
