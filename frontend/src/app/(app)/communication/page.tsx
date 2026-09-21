"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs, FilterBar, Select, SearchInput } from "@/components/ui/FilterBar";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, priorityTone, statusToTone } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { communicationApi } from "@/lib/api/communication";
import { ApiClientError } from "@/lib/api/client";
import { formatDate, formatMinutes } from "@/lib/format";
import type { Communication } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  needs_response: "Needs response", waiting: "Waiting", completed: "Completed", overdue: "Overdue",
};

export default function CommunicationPage() {
  const router = useRouter();
  const [all, setAll] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");

  useEffect(() => {
    setLoading(true);
    communicationApi
      .list()
      .then(setAll)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load communications."))
      .finally(() => setLoading(false));
  }, []);

  const tabbed = useMemo(() => {
    switch (tab) {
      case "needs_response": return all.filter((c) => c.status === "needs_response");
      case "waiting": return all.filter((c) => c.status === "waiting");
      case "completed": return all.filter((c) => c.status === "completed");
      case "overdue": return all.filter((c) => c.status === "overdue");
      case "commitments": return all.filter((c) => c.ai_finding?.commitment_detected);
      default: return all;
    }
  }, [tab, all]);

  const filtered = tabbed.filter((c) => {
    const matchesSearch = !search || c.contact.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase()) || c.organization.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priority === "all" || c.priority === priority;
    return matchesSearch && matchesPriority;
  });

  const columns: Column<Communication>[] = [
    { key: "contact", header: "Contact", render: (r) => r.contact, sortValue: (r) => r.contact },
    { key: "org", header: "Organization", render: (r) => r.organization, sortValue: (r) => r.organization },
    { key: "subject", header: "Subject", render: (r) => <span className="line-clamp-1 max-w-xs">{r.subject}</span> },
    { key: "received", header: "Received", render: (r) => formatDate(r.received_at), sortValue: (r) => r.received_at },
    { key: "status", header: "Response Status", render: (r) => <StatusBadge label={STATUS_LABEL[r.status]} tone={statusToTone(r.status)} />, sortValue: (r) => r.status },
    { key: "responseTime", header: "Response Time", render: (r) => formatMinutes(r.response_time_minutes) },
    { key: "priority", header: "Priority", render: (r) => <StatusBadge label={r.priority} tone={priorityTone(r.priority)} />, sortValue: (r) => r.priority },
    { key: "next", header: "Next Step", render: (r) => <span className="line-clamp-1 max-w-[10rem]">{r.next_step}</span> },
  ];

  return (
    <AppShell pageTitle="My Communication">
      {loading && <LoadingState rows={6} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "all", label: "All", count: all.length },
              { key: "needs_response", label: "Needs Response", count: all.filter((c) => c.status === "needs_response").length },
              { key: "waiting", label: "Waiting", count: all.filter((c) => c.status === "waiting").length },
              { key: "completed", label: "Completed", count: all.filter((c) => c.status === "completed").length },
              { key: "overdue", label: "Overdue", count: all.filter((c) => c.status === "overdue").length },
              { key: "commitments", label: "Commitments", count: all.filter((c) => c.ai_finding?.commitment_detected).length },
            ]}
          />
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search contact, subject, organization" />
            <Select
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={[
                { value: "all", label: "All" }, { value: "critical", label: "Critical" },
                { value: "high", label: "High" }, { value: "normal", label: "Normal" }, { value: "low", label: "Low" },
              ]}
            />
          </FilterBar>
          <DataTable columns={columns} rows={filtered} onRowClick={(r) => router.push(`/communication/${r.id}`)} />
        </>
      )}
    </AppShell>
  );
}
