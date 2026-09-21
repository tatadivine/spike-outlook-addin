import type { Employee } from "@/lib/types";
import { Card } from "../ui/Card";

export function EmployeeCard({ employee, onClick }: { employee: Employee; onClick?: () => void }) {
  return (
    <Card>
      <button onClick={onClick} className="flex w-full items-center gap-3 text-left" disabled={!onClick}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: employee.avatar_color }}>
          {employee.name.split(" ").map((n) => n[0]).join("")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-ink-900)]">{employee.name}</p>
          <p className="truncate text-xs text-[var(--color-ink-500)]">{employee.title}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[var(--color-ink-900)]">{employee.response_score}</p>
          <p className="text-[10px] text-[var(--color-ink-400)]">score</p>
        </div>
      </button>
    </Card>
  );
}
