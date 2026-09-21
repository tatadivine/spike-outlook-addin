"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { teamApi } from "@/lib/api/team";
import { ApiClientError } from "@/lib/api/client";
import { formatMinutes } from "@/lib/format";
import type { Employee } from "@/lib/types";

export default function EmployeeDetailPage() {
  const params = useParams<{ employeeId: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teamApi.get(params.employeeId).then(setEmployee).catch((err) => setError(err instanceof ApiClientError ? err.message : "Employee not found.")).finally(() => setLoading(false));
  }, [params.employeeId]);

  if (loading) return <AppShell pageTitle="Employee"><LoadingState rows={4} /></AppShell>;
  if (error || !employee) {
    return <AppShell pageTitle="Employee"><ErrorState message={error ?? "Not found."} onRetry={() => router.push("/team")} /></AppShell>;
  }

  return (
    <AppShell pageTitle={employee.name}>
      <button onClick={() => router.push("/team")} className="mb-4 text-xs font-medium text-[var(--color-blue-600)]">← Back to Team</button>

      <Card className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: employee.avatar_color }}>
          {employee.name.split(" ").map((n) => n[0]).join("")}
        </span>
        <div>
          <h2 className="text-base font-semibold text-[var(--color-ink-900)]">{employee.name}</h2>
          <p className="text-xs text-[var(--color-ink-500)]">{employee.title} · {employee.department}</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><p className="text-xs text-[var(--color-ink-500)]">Response Score</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{employee.response_score}</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">Median Response</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{formatMinutes(employee.median_response_minutes)}</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">SLA Compliance</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{employee.sla_compliance_pct}%</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">Open Commitments</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{employee.open_commitments}</p></Card>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-ink-500)]">
        <span className="h-2 w-2 rounded-full bg-[var(--color-blue-600)]" />
        Measured metrics above are distinct from AI-assisted indicators, which require human review before any negative performance action.
      </div>
    </AppShell>
  );
}
