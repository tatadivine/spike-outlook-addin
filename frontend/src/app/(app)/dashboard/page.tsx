"use client";

import { useEffect, useState } from "react";
import { Send, Clock, CalendarCheck, MessageCircle, AlertTriangle, Search, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricStatCard } from "@/components/dashboard/MetricStatCard";
import { ResponseTrendCard } from "@/components/dashboard/ResponseTrendCard";
import { PerformanceReviewCard } from "@/components/dashboard/PerformanceReviewCard";
import { ResponseCommitmentsTable } from "@/components/dashboard/ResponseCommitmentsTable";
import { CommunicationQualityCard } from "@/components/dashboard/CommunicationQualityCard";
import { EvidenceCoachingCard } from "@/components/dashboard/EvidenceCoachingCard";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { ManagerRosterCard } from "@/components/dashboard/ManagerRosterCard";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { useSession } from "@/lib/session";
import { dashboardApi } from "@/lib/api/dashboard";
import { ApiClientError } from "@/lib/api/client";
import type { DashboardView, RosterEmployee } from "@/lib/types";

const ICONS = [Send, Clock, CalendarCheck, MessageCircle, AlertTriangle] as const;
const TONES = ["blue", "purple", "green", "teal", "amber"] as const;

export default function DashboardPage() {
  const { role, canUseManagerView, viewMode, setViewMode, employeeId, accountType } = useSession();
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | undefined>(undefined);
  const [data, setData] = useState<DashboardView | null>(null);
  const [roster, setRoster] = useState<RosterEmployee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Reset which specific employee we're viewing whenever the mode or
    // logged-in identity changes.
    setViewingEmployeeId(undefined);
  }, [viewMode, employeeId, accountType]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const viewAs = viewMode === "manager" ? viewingEmployeeId : undefined;

    Promise.all([dashboardApi.get(viewAs), viewMode === "manager" ? dashboardApi.roster() : Promise.resolve([])])
      .then(([dash, ros]) => {
        if (cancelled) return;
        setData(dash);
        setRoster(ros);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiClientError ? err.message : "Failed to load the dashboard.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [viewMode, viewingEmployeeId]);

  const filteredRoster = roster.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell pageTitle="Home">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-4 text-white" style={{ background: "linear-gradient(90deg, #0a1428 0%, #16294d 60%, #1c3562 100%)" }}>
        <h1 className="text-lg font-semibold">Communication Effectiveness</h1>
        {canUseManagerView && (
          <div className="flex rounded-md border border-white/15 bg-white/5 p-0.5 text-xs font-medium">
            <button onClick={() => setViewMode("my")} className={`rounded px-3 py-1.5 ${viewMode === "my" ? "bg-white text-[var(--color-navy-900)]" : "text-white/70 hover:text-white"}`}>
              My View
            </button>
            <button onClick={() => setViewMode("manager")} className={`rounded px-3 py-1.5 ${viewMode === "manager" ? "bg-[var(--color-blue-600)] text-white" : "text-white/70 hover:text-white"}`}>
              Manager View
            </button>
          </div>
        )}
      </div>

      {viewMode === "manager" && (
        <div className="relative mb-4">
          <button onClick={() => setPickerOpen((v) => !v)} className="flex items-center gap-2 rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-ink-900)] hover:bg-[var(--color-surface)]">
            <span className="text-xs text-[var(--color-ink-400)]">Viewing:</span>
            {data?.scope_label ?? "Loading…"}
            <ChevronDown size={14} className="text-[var(--color-ink-400)]" />
          </button>
          {pickerOpen && (
            <div className="absolute z-30 mt-1 w-80 rounded-lg border border-[var(--color-line)] bg-white shadow-lg">
              <button
                onClick={() => { setViewingEmployeeId(undefined); setPickerOpen(false); }}
                className="block w-full border-b border-[var(--color-line)] px-3 py-2.5 text-left text-sm hover:bg-[var(--color-surface)]"
              >
                My rolled-up team view
              </button>
              <div className="relative p-2">
                <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)]" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your team..." className="w-full rounded-md border border-[var(--color-line)] py-1.5 pl-7 pr-2 text-xs" />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredRoster.map((e) => (
                  <button key={e.id} onClick={() => { setViewingEmployeeId(e.id); setPickerOpen(false); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-[var(--color-surface)]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: e.avatar_color }}>
                      {e.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <span>
                      <span className="block font-medium text-[var(--color-ink-900)]">{e.name}</span>
                      <span className="block text-[var(--color-ink-500)]">{e.title} · {e.department}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loading && <LoadingState rows={5} />}
      {!loading && error && <ErrorState message={error} onRetry={() => setViewingEmployeeId((v) => v)} />}

      {!loading && !error && data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            {data.metrics.map((m, i) => (
              <MetricStatCard
                key={m.label}
                icon={ICONS[i]}
                tone={TONES[i]}
                label={m.label}
                value={m.value}
                suffix={m.suffix ?? undefined}
                trend={m.trend}
                trendLabel={m.trend_label}
                progressPct={m.progress_pct}
                source={m.source ?? undefined}
              />
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ResponseTrendCard data={data.trend} weeksAboveGoal={data.weeks_above_goal} />
            </div>
            <PerformanceReviewCard
              overallLabel={data.review_summary.overall_label}
              deltaPoints={data.review_summary.delta_points}
              filledDots={data.review_summary.filled_dots}
              totalDots={data.review_summary.total_dots}
              strengths={data.review_summary.strengths}
              coaching={data.review_summary.coaching}
            />
          </div>

          {viewMode === "manager" && !viewingEmployeeId && (
            <div className="mb-6">
              <ManagerRosterCard
                employees={roster}
                subtitle={`${roster.length} ${roster.length === 1 ? "person reports" : "people report"} to you`}
                onSelect={(id) => setViewingEmployeeId(id)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ResponseCommitmentsTable rows={data.commitment_rows} excluded={data.excluded_messages} />
            <CommunicationQualityCard meters={data.quality_meters} />
            <EvidenceCoachingCard items={data.evidence_items} />
          </div>

          <div className="mt-4">
            <AlertsCard alerts={data.alerts} />
          </div>

          <p className="mt-6 border-t border-[var(--color-line)] pt-4 text-xs text-[var(--color-ink-500)]">
            Visible to this person and authorized management (role: {role}). Review decisions require human validation.
          </p>
        </>
      )}
    </AppShell>
  );
}
