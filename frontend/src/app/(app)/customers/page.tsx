"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SearchInput, FilterBar } from "@/components/ui/FilterBar";
import { CustomerCard } from "@/components/customers/CustomerCard";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { customersApi } from "@/lib/api/customers";
import { ApiClientError } from "@/lib/api/client";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    customersApi.list().then(setCustomers).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load customers.")).finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell pageTitle="Customers">
      <FilterBar><SearchInput value={search} onChange={setSearch} placeholder="Search customers" /></FilterBar>
      {loading && <LoadingState rows={4} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => <CustomerCard key={c.id} customer={c} onClick={() => router.push(`/customers/${c.id}`)} />)}
        </div>
      )}
    </AppShell>
  );
}
