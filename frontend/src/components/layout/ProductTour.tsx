"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, DEMO_IDENTITIES } from "@/lib/session";
import { Modal } from "../ui/Modal";

const STEPS = [
  { title: "1. Home dashboard", body: "See how a person opens their day with a clear communication effectiveness overview.", path: "/dashboard", identityKey: "employee" },
  { title: "2. Communication tracking", body: "Every message is tracked by response status, priority, and ownership.", path: "/communication", identityKey: "employee" },
  { title: "3. Evidence", body: "Every finding is traceable back to the original communication record.", path: "/evidence", identityKey: "employee" },
  { title: "4. AI coaching", body: "Insights are framed as coaching, always labeled AI-assisted.", path: "/coaching", identityKey: "employee" },
  { title: "5. Commitments", body: "Promises made in communications are tracked to completion.", path: "/commitments", identityKey: "employee" },
  { title: "6. Manager view", body: "Managers switch to Manager View to see their team's roster and rolled-up performance.", path: "/dashboard", identityKey: "sarah" },
  { title: "7. AI review", body: "Managers confirm or dismiss AI findings — nothing is automatic.", path: "/reviews", identityKey: "sarah" },
  { title: "8. Leadership analytics", body: "Leadership and admins see organization-wide trends across departments.", path: "/organization", identityKey: "administrator" },
  { title: "9. Power BI", body: "Deeper analytics live natively inside SpikeOS.", path: "/analytics", identityKey: "administrator" },
  { title: "10. Outlook Coach", body: "Employees get the same guidance directly inside Outlook.", path: "/outlook", identityKey: "employee" },
] as const;

export function ProductTour() {
  const { tourOpen, setTourOpen, switchDemoIdentity } = useSession();
  const [step, setStep] = useState(0);
  const router = useRouter();

  function goTo(i: number) {
    setStep(i);
    const identity = DEMO_IDENTITIES.find((d) => d.key === STEPS[i].identityKey) ?? DEMO_IDENTITIES[0];
    switchDemoIdentity(identity);
    router.push(STEPS[i].path);
  }

  function close() {
    setTourOpen(false);
    setStep(0);
  }

  if (!tourOpen) return null;
  const s = STEPS[step];

  return (
    <Modal open={tourOpen} onClose={close} title="SpikeOS Product Tour">
      <p className="text-sm font-medium text-[var(--color-ink-900)]">{s.title}</p>
      <p className="mt-1.5 text-sm text-[var(--color-ink-500)]">{s.body}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-[var(--color-ink-400)]">Step {step + 1} of {STEPS.length}</span>
        <div className="flex gap-2">
          {step > 0 && (
            <button onClick={() => goTo(step - 1)} className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-700)]">Back</button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => goTo(step + 1)} className="rounded-md bg-[var(--color-blue-600)] px-3 py-1.5 text-xs font-medium text-white">Next</button>
          ) : (
            <button onClick={close} className="rounded-md bg-[var(--color-blue-600)] px-3 py-1.5 text-xs font-medium text-white">Finish tour</button>
          )}
        </div>
      </div>
    </Modal>
  );
}
