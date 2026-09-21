"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";
import { StatusBadge, statusToTone } from "../ui/Badge";
import { Card } from "../ui/Card";
import { useSession } from "@/lib/session";
import { reviewsApi } from "@/lib/api/reviews";
import { ApiClientError } from "@/lib/api/client";

export function ReviewCard({ review, employeeName }: { review: Review; employeeName?: string }) {
  const { pushToast } = useSession();
  const [status, setStatus] = useState(review.status);
  const [busy, setBusy] = useState(false);

  async function decide(decision: "confirmed" | "dismissed" | "needs_context", toastMsg: string) {
    setBusy(true);
    try {
      await reviewsApi.decide(review.id, decision);
      setStatus(decision);
      pushToast(toastMsg, decision === "dismissed" ? "default" : "success");
    } catch (err) {
      pushToast(err instanceof ApiClientError ? err.message : "Could not update this review.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--color-ink-500)]">{employeeName ?? review.employee_id}</p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--color-ink-900)]">{review.finding}</p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{review.evidence}</p>
        </div>
        <StatusBadge label={status.replace("_", " ")} tone={statusToTone(status)} />
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-500)]">AI confidence: {review.ai_confidence_pct}%</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button disabled={busy} onClick={() => decide("confirmed", "Finding confirmed.")} className="rounded-md bg-[var(--color-blue-600)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-blue-500)] disabled:opacity-50">Confirm</button>
        <button disabled={busy} onClick={() => decide("dismissed", "Finding dismissed.")} className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)] disabled:opacity-50">Dismiss</button>
        <button disabled={busy} onClick={() => decide("needs_context", "Context requested from employee.")} className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)] disabled:opacity-50">Request context</button>
      </div>
    </Card>
  );
}
