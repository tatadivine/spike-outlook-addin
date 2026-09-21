"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastContainer } from "../ui/Toast";
import { ProductTour } from "./ProductTour";

export function AppShell({ pageTitle, children }: { pageTitle: string; children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-surface)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
      <ToastContainer />
      <ProductTour />
    </div>
  );
}
