"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeCard } from "@/components/team/EmployeeCard";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { teamApi } from "@/lib/api/team";
import { ApiClientError } from "@/lib/api/client";
import type { Employee } from "@/lib/types";

export default function TeamOverviewPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teamApi.list().then(setTeam).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load your team.")).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell pageTitle="Team Overview">
      {loading && <LoadingState rows={5} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((e) => <EmployeeCard key={e.id} employee={e} onClick={() => router.push(`/team/${e.id}`)} />)}
        </div>
      )}
    </AppShell>
  );
}
