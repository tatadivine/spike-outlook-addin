import type { Customer } from "@/lib/types";
import { StatusBadge, statusToTone } from "../ui/Badge";
import { Card } from "../ui/Card";

const healthLabel: Record<Customer["health"], string> = { strong: "Strong", steady: "Steady", at_risk: "At risk" };

export function CustomerCard({ customer, onClick }: { customer: Customer; onClick?: () => void }) {
  return (
    <Card>
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink-900)]">{customer.name}</p>
            <p className="text-xs text-[var(--color-ink-500)]">{customer.industry}</p>
          </div>
          <StatusBadge label={healthLabel[customer.health]} tone={statusToTone(customer.health)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div><p className="text-[var(--color-ink-400)]">Open comms</p><p className="font-medium text-[var(--color-ink-900)]">{customer.open_communications}</p></div>
          <div><p className="text-[var(--color-ink-400)]">Avg response</p><p className="font-medium text-[var(--color-ink-900)]">{Math.round(customer.avg_response_minutes / 60)}h</p></div>
          <div><p className="text-[var(--color-ink-400)]">Commitments</p><p className="font-medium text-[var(--color-ink-900)]">{customer.outstanding_commitments}</p></div>
          <div><p className="text-[var(--color-ink-400)]">Follow-ups</p><p className="font-medium text-[var(--color-ink-900)]">{customer.follow_ups}</p></div>
        </div>
      </button>
    </Card>
  );
}
