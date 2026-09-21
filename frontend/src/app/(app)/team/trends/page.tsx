"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, SectionHeader } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { teamApi } from "@/lib/api/team";
import { ApiClientError } from "@/lib/api/client";

export default function TeamTrendsPage() {
  const [data, setData] = useState<{ response_score: number; sla_compliance: number; overdue: number; headcount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teamApi.trends().then(setData).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load team trends.")).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell pageTitle="Team Trends"><LoadingState rows={4} /></AppShell>;
  if (error || !data) return <AppShell pageTitle="Team Trends"><ErrorState message={error ?? "No data"} /></AppShell>;

  return (
    <AppShell pageTitle="Team Trends">
      <p className="mb-5 text-sm text-[var(--color-ink-500)]">{data.headcount} people in your reporting chain</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><SectionHeader title="Response Score" /><p className="text-3xl font-semibold text-[var(--color-ink-900)]">{data.response_score}</p></Card>
        <Card><SectionHeader title="SLA Compliance" /><p className="text-3xl font-semibold text-[var(--color-ink-900)]">{data.sla_compliance}%</p></Card>
        <Card><SectionHeader title="Overdue Follow-ups" /><p className="text-3xl font-semibold text-[var(--color-ink-900)]">{data.overdue}</p></Card>
      </div>
    </AppShell>
  );
}
