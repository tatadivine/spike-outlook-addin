"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

export default function RootIndex() {
  const router = useRouter();
  const { isSignedIn } = useSession();

  useEffect(() => {
    router.replace(isSignedIn ? "/dashboard" : "/login");
  }, [isSignedIn, router]);

  return null;
}
