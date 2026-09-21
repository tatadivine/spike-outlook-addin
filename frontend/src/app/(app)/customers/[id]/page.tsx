"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge, statusToTone } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { customersApi } from "@/lib/api/customers";
import { ApiClientError } from "@/lib/api/client";
import type { Customer } from "@/lib/types";

const healthLabel: Record<string, string> = { strong: "Strong", steady: "Steady", at_risk: "At risk" };

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customersApi.get(params.id).then(setCustomer).catch((err) => setError(err instanceof ApiClientError ? err.message : "Customer not found.")).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <AppShell pageTitle="Customer"><LoadingState rows={4} /></AppShell>;
  if (error || !customer) return <AppShell pageTitle="Customer"><ErrorState message={error ?? "Not found."} onRetry={() => router.push("/customers")} /></AppShell>;

  return (
    <AppShell pageTitle={customer.name}>
      <button onClick={() => router.push("/customers")} className="mb-4 text-xs font-medium text-[var(--color-blue-600)]">← Back to Customers</button>

      <Card className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-ink-900)]">{customer.name}</h2>
            <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{customer.industry}</p>
          </div>
          <StatusBadge label={healthLabel[customer.health]} tone={statusToTone(customer.health)} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><p className="text-xs text-[var(--color-ink-500)]">Open Communications</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{customer.open_communications}</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">Avg Response</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{Math.round(customer.avg_response_minutes / 60)}h</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">Outstanding Commitments</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{customer.outstanding_commitments}</p></Card>
        <Card><p className="text-xs text-[var(--color-ink-500)]">Follow-ups</p><p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{customer.follow_ups}</p></Card>
      </div>
    </AppShell>
  );
}
