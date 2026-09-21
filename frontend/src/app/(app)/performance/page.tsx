"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, SectionHeader } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { StatusBadge, statusToTone } from "@/components/ui/Badge";
import { performanceApi, type PerformancePayload } from "@/lib/api/performance";
import { ApiClientError } from "@/lib/api/client";
import { formatDate, formatMinutes } from "@/lib/format";

export default function MyPerformancePage() {
  const [data, setData] = useState<PerformancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    performanceApi.get().then(setData).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load performance data.")).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell pageTitle="My Performance"><LoadingState rows={5} /></AppShell>;
  if (error || !data) return <AppShell pageTitle="My Performance"><ErrorState message={error ?? "No data"} /></AppShell>;

  const { employee, commitments, follow_ups } = data;

  return (
    <AppShell pageTitle="My Performance">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><p className="text-xs text-[var(--color-ink-500)]">Response Score</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{employee.response_score}</p><p className="text-[11px] text-[var(--color-ink-400)]">Measured — Microsoft 365 records</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">Median Response</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{formatMinutes(employee.median_response_minutes)}</p><p className="text-[11px] text-[var(--color-ink-400)]">Measured — Outlook timestamps</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">SLA Compliance</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{employee.sla_compliance_pct}%</p><p className="text-[11px] text-[var(--color-ink-400)]">Measured — rule engine</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">Positive Communication</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{employee.positive_communication_pct}%</p><p className="text-[11px] text-[var(--color-ink-400)]">AI-assisted — quality model</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SectionHeader title="Open Commitments" />
          <div className="space-y-2">
            {commitments.filter((c) => c.status !== "completed").map((c) => (
              <Card key={c.id} className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-[var(--color-ink-900)]">{c.title}</p><p className="text-xs text-[var(--color-ink-500)]">Due {formatDate(c.due_date)}</p></div>
                <StatusBadge label={c.status.replace("_", " ")} tone={statusToTone(c.status)} />
              </Card>
            ))}
          </div>
        </div>
        <div>
          <SectionHeader title="Open Follow-ups" />
          <div className="space-y-2">
            {follow_ups.filter((f) => f.status !== "completed").map((f) => (
              <Card key={f.id} className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-[var(--color-ink-900)]">{f.subject}</p><p className="text-xs text-[var(--color-ink-500)]">{f.contact} · Due {formatDate(f.due_date)}</p></div>
                <StatusBadge label={f.status.replace("_", " ")} tone={statusToTone(f.status)} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
