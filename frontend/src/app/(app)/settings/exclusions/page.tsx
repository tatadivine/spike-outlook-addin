"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { useSession } from "@/lib/session";
import { settingsApi } from "@/lib/api/settings";
import { ApiClientError } from "@/lib/api/client";
import type { ExclusionRule } from "@/lib/types";

export default function SettingsExclusionsPage() {
  const { pushToast } = useSession();
  const [items, setItems] = useState<ExclusionRule[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.exclusions().then(setItems).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load exclusion rules."));
  }, []);

  async function toggle(rule: ExclusionRule) {
    try {
      const updated = await settingsApi.updateExclusion(rule.id, !rule.enabled);
      setItems((s) => s.map((x) => (x.id === rule.id ? updated : x)));
      pushToast("Exclusion rule updated.", "success");
    } catch (err) {
      pushToast(err instanceof ApiClientError ? err.message : "Could not update this rule.", "error");
    }
  }

  if (error) return <AppShell pageTitle="Exclusions"><SettingsTabs /><ErrorState message={error} /></AppShell>;
  if (items.length === 0) return <AppShell pageTitle="Exclusions"><SettingsTabs /><LoadingState rows={5} /></AppShell>;

  return (
    <AppShell pageTitle="Exclusions">
      <SettingsTabs />
      <div className="mb-5 rounded-lg border border-[var(--color-green-100)] bg-[var(--color-green-100)]/50 p-4 text-sm text-[var(--color-green-600)]">
        Excluded communications do not negatively affect employee communication metrics.
      </div>
      <div className="space-y-3">
        {items.map((it) => (
          <Card key={it.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink-900)]">{it.label}</p>
              <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{it.description}</p>
              <p className="mt-1 text-[11px] text-[var(--color-ink-400)]">Rule: {it.rule}</p>
            </div>
            <label className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-[var(--color-ink-500)]">{it.enabled ? "Enabled" : "Disabled"}</span>
              <input type="checkbox" checked={it.enabled} onChange={() => toggle(it)} className="h-4 w-4 accent-[var(--color-blue-600)]" />
            </label>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
