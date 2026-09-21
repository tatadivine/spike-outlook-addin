/**
 * Who this add-in calls the SpikeOS backend AS.
 *
 * This is deliberately separate from auth.ts (Graph access). Right now,
 * both the web dashboard and this add-in identify themselves to the
 * SpikeOS API with demo headers — see backend/app/core/identity.py, whose
 * docstring says explicitly: "this is exactly what a verified Microsoft
 * Entra ID token will replace." When that lands, this file changes to
 * attach `Authorization: Bearer <token>` instead, and nothing else in the
 * add-in (or the backend routes) needs to change.
 *
 * Configure via outlook-addin/.env — see outlook-addin/README.md.
 */
export interface SpikeOSIdentityHeaders {
  "X-Demo-Account-Type": string;
  "X-Demo-Employee-Id"?: string;
}

export function getSpikeOSIdentityHeaders(): SpikeOSIdentityHeaders {
  const accountType = import.meta.env.VITE_DEMO_ACCOUNT_TYPE || "employee";
  const employeeId = import.meta.env.VITE_DEMO_EMPLOYEE_ID || "emp-alex-johnson";

  const headers: SpikeOSIdentityHeaders = { "X-Demo-Account-Type": accountType };
  if (accountType === "employee" && employeeId) {
    headers["X-Demo-Employee-Id"] = employeeId;
  }
  return headers;
}
