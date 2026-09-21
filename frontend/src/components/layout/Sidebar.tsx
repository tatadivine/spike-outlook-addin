"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Zap, ChevronDown, LogOut } from "lucide-react";
import clsx from "clsx";
import { visibleNav } from "./nav";
import { useSession, DEMO_IDENTITIES } from "@/lib/session";

export function Sidebar() {
  const { role, displayName, title, switchDemoIdentity, signOut } = useSession();
  const pathname = usePathname();
  const nav = visibleNav(role);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Communication: true });

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[var(--color-navy-900)] text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <Zap size={20} className="text-[var(--color-blue-400)]" fill="currentColor" />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold">SpikeOS</p>
          <p className="text-[10px] uppercase tracking-wide text-white/40">Spike Electric</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-none">
        {nav.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isOpen = openGroups[item.label] ?? false;
          const isActive = pathname === item.path;
          return (
            <div key={item.label} className="mb-0.5">
              {hasChildren ? (
                <button
                  onClick={() => setOpenGroups((s) => ({ ...s, [item.label]: !isOpen }))}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                >
                  <span className="flex items-center gap-2.5"><Icon size={16} />{item.label}</span>
                  <ChevronDown size={14} className={clsx("transition-transform", isOpen && "rotate-180")} />
                </button>
              ) : (
                <Link
                  href={item.path}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm",
                    isActive ? "bg-[var(--color-blue-600)] text-white" : "text-white/80 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon size={16} />{item.label}
                </Link>
              )}
              {hasChildren && isOpen && (
                <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                  {item.children!.map((child) => {
                    const childActive = pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        href={child.path}
                        className={clsx("block rounded-md px-2.5 py-1.5 text-[13px]", childActive ? "font-medium text-[var(--color-blue-400)]" : "text-white/60 hover:text-white")}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <div className="mb-2 rounded-md bg-white/5 px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-blue-400)]">Demo Environment</p>
          <p className="mt-1 text-xs text-white/60">Signed in with a demo identity — not Microsoft Entra ID.</p>
        </div>

        <label className="mb-2 block text-[11px] text-white/40">Switch demo identity</label>
        <select
          value={displayName}
          onChange={(e) => {
            const next = DEMO_IDENTITIES.find((d) => d.displayName === e.target.value);
            if (next) switchDemoIdentity(next);
          }}
          className="mb-3 w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white"
        >
          {DEMO_IDENTITIES.map((d) => (
            <option key={d.key} value={d.displayName} className="text-black">{d.displayName} — {d.title}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-blue-600)] text-xs font-semibold">
            {displayName.split(" ").map((n) => n[0]).join("")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{displayName}</p>
            <p className="truncate text-[11px] text-white/40">{title}</p>
          </div>
          <button onClick={signOut} aria-label="Sign out" className="text-white/40 hover:text-white">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
