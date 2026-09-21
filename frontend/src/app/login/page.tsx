"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { useSession } from "@/lib/session";

function MicrosoftMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect width="7" height="7" x="0" y="0" fill="#F25022" />
      <rect width="7" height="7" x="9" y="0" fill="#7FBA00" />
      <rect width="7" height="7" x="0" y="9" fill="#00A4EF" />
      <rect width="7" height="7" x="9" y="9" fill="#FFB900" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { isSignedIn, signIn, pushToast } = useSession();

  useEffect(() => {
    if (isSignedIn) router.replace("/dashboard");
  }, [isSignedIn, router]);

  function handleSignIn(accountType: "employee" | "administrator") {
    signIn(accountType);
    pushToast("Signed in (demo mode) — no real authentication was performed.");
    router.replace("/dashboard");
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-navy-950)]">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[var(--color-navy-900)] p-8 text-center shadow-2xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Zap size={26} className="text-[var(--color-blue-400)]" fill="currentColor" />
          <span className="text-xl font-semibold text-white">SpikeOS</span>
        </div>
        <p className="mb-8 text-sm text-white/60">Communication Effectiveness</p>

        <button
          onClick={() => handleSignIn("employee")}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-navy-900)] hover:bg-white/90"
        >
          <MicrosoftMark />
          Sign in as Employee (demo)
        </button>
        <button
          onClick={() => handleSignIn("administrator")}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
        >
          Sign in as Administrator (demo)
        </button>

        <p className="mb-6 text-[11px] leading-relaxed text-white/40">
          Enterprise authentication will be provided by Microsoft Entra ID. This build uses a
          demo identity so the product can be evaluated before Microsoft credentials exist.
        </p>

        <div className="rounded-md border border-[var(--color-blue-500)]/40 bg-[var(--color-blue-500)]/10 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-blue-400)]">Demo Environment</p>
          <p className="mt-1 text-[11px] text-white/50">
            No production backend, database, or Microsoft services are connected to this sign-in.
          </p>
        </div>
      </div>
    </div>
  );
}
