"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { PowerBIFrame } from "@/components/analytics/PowerBIFrame";
import { Card, SectionHeader } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { analyticsApi, type AnalyticsPayload } from "@/lib/api/analytics";
import { ApiClientError } from "@/lib/api/client";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi.get().then(setData).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load analytics."));
  }, []);

  if (error) return <AppShell pageTitle="SpikeOS Analytics"><ErrorState message={error} /></AppShell>;
  if (!data) return <AppShell pageTitle="SpikeOS Analytics"><LoadingState rows={5} /></AppShell>;

  return (
    <AppShell pageTitle="SpikeOS Analytics">
      <p className="mb-4 text-sm text-[var(--color-ink-500)]">{data.embed.message}</p>
      <PowerBIFrame title="Organization Communication Performance">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <SectionHeader title="Department Comparison" subtitle="Response score by department" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.department_comparison} margin={{ left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 10, fill: "#8892a0" }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: "#8892a0" }} width={32} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e3e7ee", fontSize: 12 }} />
                <Bar dataKey="response_score" fill="#2F6BFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionHeader title="SLA Performance" subtitle="SLA compliance by department" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.department_comparison} margin={{ left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 10, fill: "#8892a0" }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: "#8892a0" }} width={32} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e3e7ee", fontSize: 12 }} />
                <Bar dataKey="sla_compliance" fill="#0EA5A5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </PowerBIFrame>
    </AppShell>
  );
}
