"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { Card, SectionHeader } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { SearchInput } from "@/components/ui/FilterBar";
import { useSession, PRIVILEGE_LABELS, PRIVILEGE_DESCRIPTIONS } from "@/lib/session";
import { settingsApi } from "@/lib/api/settings";
import { teamApi } from "@/lib/api/team";
import { ApiClientError } from "@/lib/api/client";
import type { Employee, PrivilegeLevel } from "@/lib/types";

export default function SettingsPermissionsPage() {
  const { pushToast, setPrivilegeLocal } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [grants, setGrants] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([teamApi.list(), settingsApi.permissions()])
      .then(([e, g]) => { setEmployees(e); setGrants(g); })
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load permissions."));
  }, []);

  async function grant(employeeId: string, privilege: PrivilegeLevel) {
    try {
      await settingsApi.setPermission(employeeId, privilege);
      setGrants((g) => ({ ...g, [employeeId]: privilege }));
      setPrivilegeLocal(employeeId, privilege);
      pushToast("Permission updated.", "success");
    } catch (err) {
      pushToast(err instanceof ApiClientError ? err.message : "Could not update this permission.", "error");
    }
  }

  if (error) return <AppShell pageTitle="Permissions & Hierarchy"><SettingsTabs /><ErrorState message={error} /></AppShell>;
  if (employees.length === 0) return <AppShell pageTitle="Permissions & Hierarchy"><SettingsTabs /><LoadingState rows={5} /></AppShell>;

  const filtered = employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell pageTitle="Permissions & Hierarchy">
      <SettingsTabs />
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(Object.keys(PRIVILEGE_LABELS) as PrivilegeLevel[]).map((level) => (
          <Card key={level}>
            <p className="text-sm font-semibold text-[var(--color-ink-900)]">{PRIVILEGE_LABELS[level]}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-500)]">{PRIVILEGE_DESCRIPTIONS[level]}</p>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHeader title="Grant Privileges" subtitle="Choose which employees can see a team-level Manager View" action={<SearchInput value={search} onChange={setSearch} placeholder="Search employees" />} />
        <div className="max-h-[420px] overflow-y-auto divide-y divide-[var(--color-line)]">
          {filtered.slice(0, 40).map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: e.avatar_color }}>
                  {e.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink-900)]">{e.name}</p>
                  <p className="text-xs text-[var(--color-ink-500)]">{e.title} · {e.department}</p>
                </div>
              </div>
              <select
                value={grants[e.id] ?? "standard"}
                onChange={(ev) => grant(e.id, ev.target.value as PrivilegeLevel)}
                className="rounded-md border border-[var(--color-line)] px-2 py-1.5 text-xs"
              >
                {(Object.keys(PRIVILEGE_LABELS) as PrivilegeLevel[]).map((level) => (
                  <option key={level} value={level}>{PRIVILEGE_LABELS[level]}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[var(--color-ink-400)]">Showing {Math.min(40, filtered.length)} of {filtered.length} employees.</p>
      </Card>
    </AppShell>
  );
}
