"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/ui/FilterBar";
import { AlertCard } from "@/components/communication/AlertCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { alertsApi } from "@/lib/api/alerts";
import { ApiClientError } from "@/lib/api/client";
import type { AlertCategory, AlertItem } from "@/lib/types";

const CATEGORY_LABEL: Record<AlertCategory, string> = {
  needs_response: "Needs Response", overdue: "Overdue", commitment: "Commitment",
  follow_up: "Follow-up", ai_coaching: "AI Coaching", positive_indicator: "Positive Indicator",
};

export default function AlertsPage() {
  const [all, setAll] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    alertsApi.list().then(setAll).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load alerts.")).finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all" ? all : all.filter((a) => a.category === tab);

  return (
    <AppShell pageTitle="Alert Center">
      {loading && <LoadingState rows={4} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[{ key: "all", label: "All", count: all.length }, ...Object.entries(CATEGORY_LABEL).map(([key, label]) => ({ key, label, count: all.filter((a) => a.category === key).length }))]}
          />
          {filtered.length === 0 ? (
            <EmptyState title="No alerts in this category" description="You're all caught up." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => <AlertCard key={a.id} alert={a} />)}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
