"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { settingsApi } from "@/lib/api/settings";
import { ApiClientError } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { AuditEntry } from "@/lib/types";

export default function SettingsAuditPage() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.audit().then(setRows).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load the audit log."));
  }, []);

  const columns: Column<AuditEntry>[] = [
    { key: "time", header: "Timestamp", render: (r) => formatDateTime(r.timestamp), sortValue: (r) => r.timestamp },
    { key: "user", header: "User", render: (r) => r.user, sortValue: (r) => r.user },
    { key: "action", header: "Action", render: (r) => r.action },
    { key: "resource", header: "Resource", render: (r) => r.resource },
    { key: "result", header: "Result", render: (r) => <StatusBadge label={r.result} tone={r.result === "success" ? "success" : "danger"} /> },
    { key: "ip", header: "IP", render: (r) => r.ip },
  ];

  if (error) return <AppShell pageTitle="Audit Log"><SettingsTabs /><ErrorState message={error} /></AppShell>;
  if (rows.length === 0) return <AppShell pageTitle="Audit Log"><SettingsTabs /><LoadingState rows={5} /></AppShell>;

  return (
    <AppShell pageTitle="Audit Log">
      <SettingsTabs />
      <DataTable columns={columns} rows={rows} />
    </AppShell>
  );
}
