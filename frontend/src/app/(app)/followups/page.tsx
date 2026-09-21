"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, statusToTone } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { followupsApi } from "@/lib/api/followups";
import { ApiClientError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { FollowUp } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = { open: "Open", overdue: "Overdue", due_today: "Due today", completed: "Completed", escalated: "Escalated" };

export default function FollowUpsPage() {
  const { pushToast } = useSession();
  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    followupsApi.list().then(setItems).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load follow-ups.")).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Open Follow-ups", count: items.filter((f) => f.status === "open").length },
    { label: "Overdue", count: items.filter((f) => f.status === "overdue").length },
    { label: "Due Today", count: items.filter((f) => f.status === "due_today").length },
    { label: "Completed", count: items.filter((f) => f.status === "completed").length },
    { label: "Escalated", count: items.filter((f) => f.status === "escalated").length },
  ];

  const columns: Column<FollowUp>[] = [
    { key: "contact", header: "Contact", render: (r) => r.contact },
    { key: "subject", header: "Subject", render: (r) => <span className="line-clamp-1 max-w-xs">{r.subject}</span> },
    { key: "due", header: "Due Date", render: (r) => formatDate(r.due_date), sortValue: (r) => r.due_date },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={STATUS_LABEL[r.status]} tone={statusToTone(r.status)} /> },
    { key: "last", header: "Last Activity", render: (r) => formatDate(r.last_activity) },
    {
      key: "actions", header: "Next Action",
      render: () => (
        <div className="flex gap-2">
          <button onClick={() => pushToast("Follow-up marked complete.", "success")} className="text-xs font-medium text-[var(--color-blue-600)]">Complete</button>
          <button onClick={() => pushToast("Follow-up rescheduled.")} className="text-xs text-[var(--color-ink-500)]">Reschedule</button>
          <button onClick={() => pushToast("Follow-up assigned.")} className="text-xs text-[var(--color-ink-500)]">Assign</button>
        </div>
      ),
    },
  ];

  return (
    <AppShell pageTitle="Follow-ups">
      {loading && <LoadingState rows={5} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {cards.map((c) => (
              <Card key={c.label}><p className="text-xs text-[var(--color-ink-500)]">{c.label}</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{c.count}</p></Card>
            ))}
          </div>
          <DataTable columns={columns} rows={items} />
        </>
      )}
    </AppShell>
  );
}
