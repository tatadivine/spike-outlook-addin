"use client";

import { Card, SectionHeader } from "../ui/Card";
import { useSession } from "@/lib/session";
import type { DashboardAlert } from "@/lib/types";

export function AlertsCard({ alerts }: { alerts: DashboardAlert[] }) {
  const { pushToast } = useSession();

  if (alerts.length === 0) {
    return (
      <Card>
        <SectionHeader title="Alerts" />
        <p className="text-sm text-[var(--color-ink-500)]">No open alerts — everything is on track.</p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Alerts" subtitle="Actionable items that need a response" />
      <div className="space-y-2.5">
        {alerts.map((a) => (
          <div key={a.id} className="rounded-lg border border-[var(--color-line)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      a.severity === "high"
                        ? "bg-[var(--color-red-100)] text-[var(--color-red-600)]"
                        : a.severity === "medium"
                        ? "bg-[var(--color-amber-100)] text-[var(--color-amber-600)]"
                        : "bg-[var(--color-line)] text-[var(--color-ink-500)]"
                    }`}
                  >
                    {a.severity}
                  </span>
                  <p className="truncate text-sm font-semibold text-[var(--color-ink-900)]">{a.title}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--color-ink-700)]">{a.subject}</p>
                <p className="mt-0.5 truncate text-[11px] text-[var(--color-ink-500)]">{a.from} — {a.preview}</p>
              </div>
              <span className="shrink-0 text-[11px] font-medium text-[var(--color-ink-500)]">{a.meta}</span>
            </div>
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => pushToast(`${a.action} — ${a.title}`, "success")}
                className="rounded-md bg-[var(--color-blue-600)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-blue-500)]"
              >
                {a.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
