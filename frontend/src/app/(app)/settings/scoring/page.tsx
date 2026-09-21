"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { Card, SectionHeader } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { useSession } from "@/lib/session";
import { settingsApi } from "@/lib/api/settings";
import { ApiClientError } from "@/lib/api/client";
import type { ScoringRule } from "@/lib/types";

export default function SettingsScoringPage() {
  const { pushToast } = useSession();
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.scoring().then(setRules).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load scoring rules."));
  }, []);

  async function save(id: string, value: string) {
    try {
      const updated = await settingsApi.updateScoring(id, value);
      setRules((rs) => rs.map((r) => (r.id === id ? updated : r)));
      setEditing(null);
      pushToast("Scoring rule updated.", "success");
    } catch (err) {
      pushToast(err instanceof ApiClientError ? err.message : "Could not update this rule.", "error");
    }
  }

  if (error) return <AppShell pageTitle="Scoring Rules"><SettingsTabs /><ErrorState message={error} /></AppShell>;
  if (rules.length === 0) return <AppShell pageTitle="Scoring Rules"><SettingsTabs /><LoadingState rows={4} /></AppShell>;

  return (
    <AppShell pageTitle="Scoring Rules">
      <SettingsTabs />
      <Card>
        <SectionHeader title="Scoring Rules" subtitle="Targets used to evaluate response performance" />
        <div className="divide-y divide-[var(--color-line)]">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <span className="text-sm text-[var(--color-ink-900)]">{r.label}</span>
              {editing === r.id ? (
                <input
                  defaultValue={r.value}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save(r.id, (e.target as HTMLInputElement).value);
                  }}
                  onBlur={(e) => save(r.id, e.target.value)}
                  className="w-36 rounded-md border border-[var(--color-line)] px-2 py-1 text-sm"
                />
              ) : (
                <button onClick={() => setEditing(r.id)} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--color-ink-900)]">{r.value}</span>
                  <span className="text-xs text-[var(--color-blue-600)]">Edit</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
