import { Users, Building2, Crown, ClipboardList, type LucideIcon } from "lucide-react";
import { Card, SectionHeader } from "../ui/Card";
import type { CommitmentRow as CommitmentRowType, ExcludedMessage } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  Customers: Users, "Internal Team": Building2, Leadership: Crown, "Direct Reports": ClipboardList, Total: Users,
};

export function ResponseCommitmentsTable({ rows, excluded }: { rows: CommitmentRowType[]; excluded: ExcludedMessage[] }) {
  return (
    <Card>
      <SectionHeader title="Response Commitments" />
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-400)]">
            <th className="pb-2 font-medium">Category</th>
            <th className="pb-2 font-medium">Within SLA</th>
            <th className="pb-2 font-medium">Overdue</th>
            <th className="pb-2 text-right font-medium">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const Icon = ICONS[r.category] ?? Users;
            return (
              <tr key={r.category} className={`border-b border-[var(--color-line)] last:border-0 ${r.bold ? "bg-[var(--color-surface)]" : ""}`}>
                <td className="py-2.5">
                  <span className="flex items-center gap-2">
                    <Icon size={14} className="text-[var(--color-ink-400)]" />
                    <span className={r.bold ? "font-semibold text-[var(--color-ink-900)]" : "text-[var(--color-ink-700)]"}>{r.category}</span>
                  </span>
                </td>
                <td className="py-2.5">
                  <span className="font-medium text-[var(--color-ink-900)]">{r.within_sla_pct}%</span>
                  <span className="ml-1 text-xs text-[var(--color-ink-400)]">{r.within_sla_numerator} / {r.within_sla_denominator}</span>
                </td>
                <td className="py-2.5 text-[var(--color-ink-700)]">{r.overdue}</td>
                <td className={`py-2.5 text-right ${r.trend === "up" ? "text-[var(--color-green-600)]" : r.trend === "down" ? "text-[var(--color-red-600)]" : "text-[var(--color-ink-400)]"}`}>
                  {r.trend === "up" ? "▲" : r.trend === "down" ? "▼" : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {excluded.length > 0 && (
        <div className="mt-4 border-t border-[var(--color-line)] pt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-400)]">Excluded from SLA (fair by design)</p>
          <ul className="space-y-1.5">
            {excluded.map((e, i) => (
              <li key={i} className="text-[11px] text-[var(--color-ink-500)]">
                <span className="text-[var(--color-ink-700)]">{e.subject}</span> — {e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
