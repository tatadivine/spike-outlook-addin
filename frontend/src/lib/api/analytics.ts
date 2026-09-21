import { apiClient } from "./client";
import type { DepartmentAggregate } from "./organization";

export interface AnalyticsPayload {
  embed: { mode: string; report_key: string; message: string };
  department_comparison: DepartmentAggregate[];
  org_aggregate: DepartmentAggregate;
}

export const analyticsApi = {
  get: () => apiClient.get<AnalyticsPayload>("/analytics"),
};
