"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, SectionHeader } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { TrendChart } from "@/components/ui/TrendChart";
import { organizationApi } from "@/lib/api/organization";
import { ApiClientError } from "@/lib/api/client";

export default function OrganizationTrendsPage() {
  const [trend, setTrend] = useState<{ label: string; value: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    organizationApi.trends().then((d) => setTrend(d.trend)).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load trends."));
  }, []);

  if (error) return <AppShell pageTitle="Organization Trends"><ErrorState message={error} /></AppShell>;
  if (!trend) return <AppShell pageTitle="Organization Trends"><LoadingState rows={4} /></AppShell>;

  return (
    <AppShell pageTitle="Organization Trends">
      <Card>
        <SectionHeader title="Response Performance" subtitle="Organization-wide, last 4 weeks" />
        <TrendChart data={trend.map((t) => ({ label: t.label, value: t.value }))} />
      </Card>
    </AppShell>
  );
}
