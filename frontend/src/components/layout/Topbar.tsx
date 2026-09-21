"use client";

import { useState } from "react";
import { Bell, Layers, PlayCircle } from "lucide-react";
import { useSession } from "@/lib/session";
import { Modal } from "../ui/Modal";
import { HowSpikeOSWorks } from "./HowSpikeOSWorks";

export function Topbar({ pageTitle }: { pageTitle: string }) {
  const { setTourOpen, pushToast } = useSession();
  const [howOpen, setHowOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-line)] bg-white px-6">
      <h1 className="text-[15px] font-semibold text-[var(--color-ink-900)]">{pageTitle}</h1>
      <div className="flex items-center gap-2">
        <button onClick={() => setHowOpen(true)} className="flex items-center gap-1.5 rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]">
          <Layers size={14} /> How SpikeOS Works
        </button>
        <button
          onClick={() => { setTourOpen(true); pushToast("Product tour started."); }}
          className="flex items-center gap-1.5 rounded-md bg-[var(--color-blue-600)] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-blue-500)]"
        >
          <PlayCircle size={14} /> Start Product Tour
        </button>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-ink-500)] hover:bg-[var(--color-surface)]">
          <Bell size={17} />
        </button>
      </div>
      <Modal open={howOpen} onClose={() => setHowOpen(false)} title="How SpikeOS Works" width="max-w-2xl">
        <HowSpikeOSWorks />
      </Modal>
    </header>
  );
}
