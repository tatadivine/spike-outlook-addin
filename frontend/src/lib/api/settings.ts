import { apiClient } from "./client";
import type { ExclusionRule, IntegrationStatus, ScoringRule, AuditEntry } from "@/lib/types";

export const settingsApi = {
  scoring: () => apiClient.get<ScoringRule[]>("/settings/scoring"),
  updateScoring: (id: string, value: string) => apiClient.patch<ScoringRule>(`/settings/scoring/${id}`, { value }),
  exclusions: () => apiClient.get<ExclusionRule[]>("/settings/exclusions"),
  updateExclusion: (id: string, enabled: boolean) =>
    apiClient.patch<ExclusionRule>(`/settings/exclusions/${id}`, { enabled }),
  integrations: () => apiClient.get<IntegrationStatus[]>("/settings/integrations"),
  permissions: () => apiClient.get<Record<string, string>>("/settings/permissions"),
  setPermission: (employeeId: string, privilege: string) =>
    apiClient.post("/settings/permissions", { employee_id: employeeId, privilege }),
  audit: () => apiClient.get<AuditEntry[]>("/settings/audit"),
};
