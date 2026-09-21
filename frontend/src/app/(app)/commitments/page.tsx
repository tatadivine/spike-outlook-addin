"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, SectionHeader } from "@/components/ui/Card";
import { CommitmentCard } from "@/components/communication/CommitmentCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { commitmentsApi } from "@/lib/api/commitments";
import { ApiClientError } from "@/lib/api/client";
import type { Commitment } from "@/lib/types";

export default function CommitmentsPage() {
  const [all, setAll] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commitmentsApi.list().then(setAll).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load commitments.")).finally(() => setLoading(false));
  }, []);

  const groups: { key: string; label: string; filter: (c: Commitment) => boolean }[] = [
    { key: "due_today", label: "Due Today", filter: (c) => c.status === "due_today" },
    { key: "overdue", label: "Overdue", filter: (c) => c.status === "overdue" },
    { key: "due_this_week", label: "Due This Week", filter: (c) => c.status === "due_this_week" },
    { key: "active", label: "Active Commitments", filter: (c) => c.status === "active" },
    { key: "completed", label: "Completed", filter: (c) => c.status === "completed" },
  ];

  return (
    <AppShell pageTitle="Commitments">
      {loading && <LoadingState rows={5} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {groups.map((g) => (
              <Card key={g.key}>
                <p className="text-xs text-[var(--color-ink-500)]">{g.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{all.filter(g.filter).length}</p>
              </Card>
            ))}
          </div>
          {groups.map((g) => {
            const items = all.filter(g.filter);
            if (items.length === 0) return null;
            return (
              <div key={g.key} className="mb-6">
                <SectionHeader title={g.label} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((c) => <CommitmentCard key={c.id} commitment={c} />)}
                </div>
              </div>
            );
          })}
          {all.length === 0 && <EmptyState title="No commitments found" description="Commitments detected in your communications will appear here." />}
        </>
      )}
    </AppShell>
  );
}
