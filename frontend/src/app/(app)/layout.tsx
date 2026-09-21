"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn } = useSession();

  useEffect(() => {
    if (!isSignedIn) router.replace("/login");
  }, [isSignedIn, router]);

  if (!isSignedIn) return null;
  return <>{children}</>;
}
