"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { organizationApi, type DepartmentAggregate } from "@/lib/api/organization";
import { ApiClientError } from "@/lib/api/client";

export default function DepartmentsPage() {
  const [rows, setRows] = useState<DepartmentAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    organizationApi.departments().then(setRows).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load departments.")).finally(() => setLoading(false));
  }, []);

  const columns: Column<DepartmentAggregate>[] = [
    { key: "dept", header: "Department", render: (r) => r.department, sortValue: (r) => r.department },
    { key: "headcount", header: "Employees", render: (r) => r.headcount, sortValue: (r) => r.headcount },
    { key: "score", header: "Response Score", render: (r) => r.response_score, sortValue: (r) => r.response_score },
    { key: "sla", header: "SLA Compliance", render: (r) => `${r.sla_compliance}%`, sortValue: (r) => r.sla_compliance },
    { key: "overdue", header: "Overdue", render: (r) => r.overdue, sortValue: (r) => r.overdue },
    { key: "commit", header: "Open Commitments", render: (r) => r.open_commitments, sortValue: (r) => r.open_commitments },
    { key: "positive", header: "Positive Communication", render: (r) => `${r.positive_communication}%`, sortValue: (r) => r.positive_communication },
  ];

  return (
    <AppShell pageTitle="Department Performance">
      {loading && <LoadingState rows={5} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && <DataTable columns={columns} rows={rows} />}
    </AppShell>
  );
}
