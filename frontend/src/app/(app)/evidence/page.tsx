"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/ui/FilterBar";
import { EvidenceCard } from "@/components/performance/EvidenceCard";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { evidenceApi } from "@/lib/api/evidence";
import { ApiClientError } from "@/lib/api/client";
import type { Evidence } from "@/lib/types";

export default function EvidencePage() {
  const [all, setAll] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    evidenceApi.list().then(setAll).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load evidence.")).finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all" ? all : all.filter((e) => e.result === tab);

  return (
    <AppShell pageTitle="Evidence Center">
      <div className="mb-6 rounded-lg border border-[var(--color-blue-100)] bg-[var(--color-blue-50)] p-4 text-sm text-[var(--color-blue-600)]">
        Every metric, alert, score, or finding in SpikeOS is traceable to a supporting communication record.
      </div>
      {loading && <LoadingState rows={4} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "all", label: "All", count: all.length },
              { key: "confirmed", label: "Confirmed", count: all.filter((e) => e.result === "confirmed").length },
              { key: "excluded", label: "Excluded", count: all.filter((e) => e.result === "excluded").length },
              { key: "under_review", label: "Under Review", count: all.filter((e) => e.result === "under_review").length },
            ]}
          />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filtered.map((e) => <EvidenceCard key={e.id} evidence={e} />)}
          </div>
        </>
      )}
    </AppShell>
  );
}
