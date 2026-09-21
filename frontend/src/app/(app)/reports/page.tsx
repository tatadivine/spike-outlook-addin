"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { FileText } from "lucide-react";
import { useSession } from "@/lib/session";
import { reportsApi, type ReportSummary } from "@/lib/api/reports";
import { ApiClientError } from "@/lib/api/client";

export default function ReportsPage() {
  const { pushToast } = useSession();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportsApi.list().then(setReports).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load reports."));
  }, []);

  if (error) return <AppShell pageTitle="Reports"><ErrorState message={error} /></AppShell>;
  if (reports.length === 0) return <AppShell pageTitle="Reports"><LoadingState rows={4} /></AppShell>;

  return (
    <AppShell pageTitle="Reports">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.id}>
            <FileText size={18} className="mb-2 text-[var(--color-blue-600)]" />
            <p className="text-sm font-semibold text-[var(--color-ink-900)]">{r.title}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-500)]">{r.description}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => pushToast(`Viewing ${r.title}...`)} className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]">View</button>
              <button onClick={() => pushToast(`${r.title} generated.`, "success")} className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]">Generate</button>
              <button onClick={() => pushToast(`${r.title} exported.`, "success")} className="rounded-md bg-[var(--color-blue-600)] px-2.5 py-1 text-xs text-white hover:bg-[var(--color-blue-500)]">Export</button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
