"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, SectionHeader } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { organizationApi, type OrganizationOverview } from "@/lib/api/organization";
import { ApiClientError } from "@/lib/api/client";

export default function OrganizationPage() {
  const [data, setData] = useState<OrganizationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    organizationApi.overview().then(setData).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load organization overview.")).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell pageTitle="Organization — Leadership Dashboard"><LoadingState rows={5} /></AppShell>;
  if (error || !data) return <AppShell pageTitle="Organization"><ErrorState message={error ?? "No data"} /></AppShell>;

  return (
    <AppShell pageTitle="Organization — Leadership Dashboard">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><p className="text-xs text-[var(--color-ink-500)]">Employees</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{data.org_aggregate.headcount}</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">Response Score</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{data.org_aggregate.response_score}</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">SLA Compliance</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{data.org_aggregate.sla_compliance}%</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">Open Commitments</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{data.org_aggregate.open_commitments}</p></Card>
      </div>

      <SectionHeader title="Department Comparison" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.departments.map((d) => (
          <Card key={d.department}>
            <p className="text-sm font-semibold text-[var(--color-ink-900)]">{d.department}</p>
            <p className="text-xs text-[var(--color-ink-500)]">{d.headcount} employees</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><p className="text-[var(--color-ink-400)]">Response score</p><p className="font-medium text-[var(--color-ink-900)]">{d.response_score}</p></div>
              <div><p className="text-[var(--color-ink-400)]">SLA</p><p className="font-medium text-[var(--color-ink-900)]">{d.sla_compliance}%</p></div>
              <div><p className="text-[var(--color-ink-400)]">Overdue</p><p className="font-medium text-[var(--color-ink-900)]">{d.overdue}</p></div>
              <div><p className="text-[var(--color-ink-400)]">Commitments</p><p className="font-medium text-[var(--color-ink-900)]">{d.open_commitments}</p></div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
