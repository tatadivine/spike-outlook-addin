"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AccountType, PrivilegeLevel, Role } from "@/lib/types";
import { setDemoIdentity } from "@/lib/api/client";

export const ALEX_ID = "emp-alex-johnson";
export const HERO_MANAGER_ID = "mgr-operations";

export interface DemoIdentity {
  key: string;
  accountType: AccountType;
  employeeId: string | null;
  displayName: string;
  title: string;
}

export const LOGIN_IDENTITIES: Record<AccountType, DemoIdentity> = {
  employee: {
    key: "employee",
    accountType: "employee",
    employeeId: ALEX_ID,
    displayName: "Alex Johnson",
    title: "Operations Coordinator",
  },
  administrator: {
    key: "administrator",
    accountType: "administrator",
    employeeId: null,
    displayName: "System Administrator",
    title: "SpikeOS Administrator",
  },
};

export const DEMO_IDENTITIES: DemoIdentity[] = [
  LOGIN_IDENTITIES.employee,
  {
    key: "sarah",
    accountType: "employee",
    employeeId: HERO_MANAGER_ID,
    displayName: "Sarah Williams",
    title: "Operations Manager",
  },
  LOGIN_IDENTITIES.administrator,
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  employee: "Employee",
  administrator: "Administrator",
};

export const PRIVILEGE_LABELS: Record<PrivilegeLevel, string> = {
  standard: "Standard Employee",
  team_lead: "Team Lead",
  manager: "Manager",
};

export const PRIVILEGE_DESCRIPTIONS: Record<PrivilegeLevel, string> = {
  standard: "Sees only their own communication dashboard.",
  team_lead: "Adds a Manager View scoped to any direct reports assigned to them.",
  manager: "Adds a Manager View with full visibility into their direct reports' dashboards.",
};

// Client-side privilege cache purely for instant nav rendering — the
// SERVER re-derives and enforces the real role on every request
// regardless of what this says. See backend/app/services/permissions_service.py.
const DEFAULT_PRIVILEGES: Record<string, PrivilegeLevel> = {
  [HERO_MANAGER_ID]: "manager",
};

function privilegeToRole(privilege: PrivilegeLevel): Role {
  if (privilege === "manager") return "manager";
  if (privilege === "team_lead") return "team_lead";
  return "employee";
}

interface Toast {
  id: number;
  message: string;
  tone: "default" | "success" | "error";
}

export type ViewMode = "my" | "manager";

interface SessionContextValue {
  isSignedIn: boolean;
  accountType: AccountType;
  employeeId: string | null;
  displayName: string;
  title: string;
  signIn: (accountType: AccountType) => void;
  signOut: () => void;
  switchDemoIdentity: (identity: DemoIdentity) => void;

  role: Role;
  privileges: Record<string, PrivilegeLevel>;
  setPrivilegeLocal: (employeeId: string, level: PrivilegeLevel) => void;
  canUseManagerView: boolean;

  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  toasts: Toast[];
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  tourOpen: boolean;
  setTourOpen: (v: boolean) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);
const STORAGE_KEY = "spikeos-demo-identity";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<DemoIdentity | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [privileges, setPrivileges] = useState<Record<string, PrivilegeLevel>>(DEFAULT_PRIVILEGES);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tourOpen, setTourOpen] = useState(false);
  const [viewMode, setViewModeState] = useState<ViewMode>("my");

  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        setIdentity(JSON.parse(raw));
      } catch {
        setIdentity(null);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (identity) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    else window.localStorage.removeItem(STORAGE_KEY);
    setDemoIdentity({
      accountType: identity?.accountType ?? "employee",
      employeeId: identity?.employeeId ?? null,
    });
  }, [identity, hydrated]);

  const pushToast = useCallback((message: string, tone: Toast["tone"] = "default") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const signIn = useCallback((accountType: AccountType) => {
    setIdentity(LOGIN_IDENTITIES[accountType]);
    setViewModeState("my");
  }, []);

  const signOut = useCallback(() => {
    setIdentity(null);
  }, []);

  const switchDemoIdentity = useCallback((next: DemoIdentity) => {
    setIdentity(next);
    setViewModeState("my");
  }, []);

  const setPrivilegeLocal = useCallback((employeeId: string, level: PrivilegeLevel) => {
    setPrivileges((prev) => ({ ...prev, [employeeId]: level }));
  }, []);

  const role: Role =
    identity?.accountType === "administrator"
      ? "administrator"
      : privilegeToRole(privileges[identity?.employeeId ?? ""] ?? "standard");

  const canUseManagerView = role !== "employee";

  const setViewMode = useCallback(
    (v: ViewMode) => setViewModeState(v === "manager" && !canUseManagerView ? "my" : v),
    [canUseManagerView]
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      isSignedIn: hydrated && identity !== null,
      accountType: identity?.accountType ?? "employee",
      employeeId: identity?.employeeId ?? null,
      displayName: identity?.displayName ?? "",
      title: identity?.title ?? "",
      signIn,
      signOut,
      switchDemoIdentity,
      role,
      privileges,
      setPrivilegeLocal,
      canUseManagerView,
      viewMode: canUseManagerView ? viewMode : "my",
      setViewMode,
      toasts,
      pushToast,
      tourOpen,
      setTourOpen,
    }),
    [
      hydrated, identity, signIn, signOut, switchDemoIdentity, role, privileges,
      setPrivilegeLocal, canUseManagerView, viewMode, setViewMode, toasts, pushToast, tourOpen,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
