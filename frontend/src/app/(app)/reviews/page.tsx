"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/ui/FilterBar";
import { ReviewCard } from "@/components/team/ReviewCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { reviewsApi } from "@/lib/api/reviews";
import { teamApi } from "@/lib/api/team";
import { ApiClientError } from "@/lib/api/client";
import type { Review, Employee } from "@/lib/types";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    Promise.all([reviewsApi.list(), teamApi.list()])
      .then(([r, e]) => { setReviews(r); setEmployees(e); })
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load reviews."))
      .finally(() => setLoading(false));
  }, []);

  const nameFor = (id: string) => employees.find((e) => e.id === id)?.name;
  const filtered = tab === "all" ? reviews : reviews.filter((r) => r.status === tab);

  return (
    <AppShell pageTitle="Manager Review Center">
      <div className="mb-6 rounded-lg border border-[var(--color-blue-100)] bg-[var(--color-blue-50)] p-4 text-sm text-[var(--color-blue-600)]">
        AI findings are never automatically final. Every item below requires a manager decision.
      </div>
      {loading && <LoadingState rows={4} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "all", label: "All", count: reviews.length },
              { key: "pending_review", label: "Pending Review", count: reviews.filter((r) => r.status === "pending_review").length },
              { key: "needs_context", label: "Needs Context", count: reviews.filter((r) => r.status === "needs_context").length },
              { key: "confirmed", label: "Confirmed", count: reviews.filter((r) => r.status === "confirmed").length },
              { key: "dismissed", label: "Dismissed", count: reviews.filter((r) => r.status === "dismissed").length },
            ]}
          />
          {filtered.length === 0 ? (
            <EmptyState title="No findings in this category" />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {filtered.map((r) => <ReviewCard key={r.id} review={r} employeeName={nameFor(r.employee_id)} />)}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
