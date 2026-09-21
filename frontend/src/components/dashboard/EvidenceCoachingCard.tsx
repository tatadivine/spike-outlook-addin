"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Card, SectionHeader } from "../ui/Card";
import type { DashboardEvidenceItem } from "@/lib/types";

export function EvidenceCoachingCard({ items }: { items: DashboardEvidenceItem[] }) {
  const [tab, setTab] = useState<"positive" | "attention">("positive");
  const positive = items.filter((i) => i.positive);
  const attention = items.filter((i) => !i.positive);
  const visible = tab === "positive" ? positive : attention;

  return (
    <Card>
      <SectionHeader title="Evidence & Coaching" />
      <div className="mb-3 flex rounded-md border border-[var(--color-line)] p-0.5 text-xs font-medium">
        <button onClick={() => setTab("positive")} className={`flex-1 rounded px-2 py-1.5 ${tab === "positive" ? "bg-[var(--color-blue-600)] text-white" : "text-[var(--color-ink-500)]"}`}>
          Positive Examples ({positive.length})
        </button>
        <button onClick={() => setTab("attention")} className={`flex-1 rounded px-2 py-1.5 ${tab === "attention" ? "bg-[var(--color-ink-900)] text-white" : "text-[var(--color-ink-500)]"}`}>
          Needs Attention ({attention.length})
        </button>
      </div>

      <div className="space-y-2.5">
        {visible.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-lg border border-[var(--color-line)] p-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${item.positive ? "bg-[var(--color-green-600)]" : "bg-[var(--color-amber-600)]"}`}>
              {item.positive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold text-[var(--color-ink-900)]">{item.title}</p>
                <span className="shrink-0 text-[10px] text-[var(--color-ink-400)]">{item.date}</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] italic text-[var(--color-ink-500)]">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="rounded-md bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-ink-500)]">{item.tag}</span>
                {item.ai_note && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--color-blue-600)]">
                    <Sparkles size={10} /> {item.ai_note}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 flex items-center gap-1.5 border-t border-[var(--color-line)] pt-3 text-[11px] text-[var(--color-ink-400)]">
        <Sparkles size={11} className="text-[var(--color-blue-600)]" />
        AI-assisted indicators · Manager validation required
      </p>
    </Card>
  );
}
