"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/ui/Card";
import { AIInsightCard } from "@/components/performance/AIInsightCard";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { coachingApi } from "@/lib/api/coaching";
import { ApiClientError } from "@/lib/api/client";
import type { AIInsight } from "@/lib/types";

const SECTIONS: { key: AIInsight["kind"]; title: string; subtitle: string }[] = [
  { key: "strength", title: "Communication Strengths", subtitle: "What's working well" },
  { key: "improve", title: "Areas to Improve", subtitle: "Opportunities worth a look" },
  { key: "follow_through", title: "Follow-through Opportunities", subtitle: "Conversations that may need another touch" },
  { key: "response", title: "Response Opportunities", subtitle: "Patterns in how you respond" },
  { key: "positive", title: "Positive Communication", subtitle: "Recognized by customers and peers" },
];

export default function CoachingPage() {
  const [items, setItems] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    coachingApi.list().then(setItems).catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load coaching insights.")).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell pageTitle="AI Coaching">
      <div className="mb-6 rounded-lg border border-[var(--color-blue-100)] bg-[var(--color-blue-50)] p-4 text-sm text-[var(--color-blue-600)]">
        This is a coaching assistant, not a performance verdict. Every insight is AI-assisted and can be reviewed, given context, or dismissed.
      </div>
      {loading && <LoadingState rows={4} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && SECTIONS.map((s) => {
        const sectionItems = items.filter((i) => i.kind === s.key);
        if (sectionItems.length === 0) return null;
        return (
          <div key={s.key} className="mb-6">
            <SectionHeader title={s.title} subtitle={s.subtitle} />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {sectionItems.map((i) => <AIInsightCard key={i.id} insight={i} />)}
            </div>
          </div>
        );
      })}
    </AppShell>
  );
}
