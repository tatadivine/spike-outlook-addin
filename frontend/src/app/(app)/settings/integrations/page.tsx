"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { settingsApi } from "@/lib/api/settings";
import { ApiClientError } from "@/lib/api/client";
import type { IntegrationStatus } from "@/lib/types";

const TONE: Record<IntegrationStatus["status"], "success" | "info" | "neutral" | "danger"> = {
  connected: "success", mock_mode: "info", not_configured: "neutral", error: "danger",
};
const LABEL: Record<IntegrationStatus["status"], string> = {
  connected: "Connected", mock_mode: "Mock Mode", not_configured: "Not Configured", error: "Error",
};

export default function SettingsIntegrationsPage() {
  const [items, setItems] = useState<IntegrationStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.integrations().then(setItems).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load integration status."));
  }, []);

  if (error) return <AppShell pageTitle="Integrations"><SettingsTabs /><ErrorState message={error} /></AppShell>;
  if (items.length === 0) return <AppShell pageTitle="Integrations"><SettingsTabs /><LoadingState rows={4} /></AppShell>;

  return (
    <AppShell pageTitle="Integrations">
      <SettingsTabs />
      <div className="mb-5 rounded-lg border border-[var(--color-blue-100)] bg-[var(--color-blue-50)] p-4 text-sm text-[var(--color-blue-600)]">
        DEMO MODE — no real connections are active. This reflects the FastAPI backend&apos;s actual provider configuration (DATA_SOURCE / AI_PROVIDER env vars).
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <Card key={i.name}>
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-[var(--color-ink-900)]">{i.name}</p>
              <StatusBadge label={LABEL[i.status]} tone={TONE[i.status]} />
            </div>
            <p className="mt-2 text-xs text-[var(--color-ink-500)]">{i.description}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
