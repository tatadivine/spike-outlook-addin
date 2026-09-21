import { Sparkles } from "lucide-react";
import { Card, SectionHeader } from "../ui/Card";
import type { QualityMeter } from "@/lib/types";

export function CommunicationQualityCard({ meters }: { meters: QualityMeter[] }) {
  return (
    <Card>
      <SectionHeader
        title="Communication Quality"
        action={
          <span className="flex items-center gap-1 rounded-full bg-[var(--color-blue-50)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-blue-600)]">
            <Sparkles size={11} /> AI-assisted indicators
          </span>
        }
      />
      <div className="space-y-4">
        {meters.map((m) => (
          <div key={m.label}>
            <div className="mb-1 flex items-baseline justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-ink-900)]">{m.label}</p>
                <p className="text-[11px] text-[var(--color-ink-500)]">{m.sub}</p>
              </div>
              <span className="text-sm font-semibold text-[var(--color-ink-900)]">{m.pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
              <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
