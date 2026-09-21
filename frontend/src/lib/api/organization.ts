import { apiClient } from "./client";

export interface DepartmentAggregate {
  department: string;
  headcount: number;
  response_score: number;
  median_response: number;
  sla_compliance: number;
  overdue: number;
  open_commitments: number;
  positive_communication: number;
}

export interface OrganizationOverview {
  org_aggregate: DepartmentAggregate & { headcount: number };
  departments: DepartmentAggregate[];
}

export const organizationApi = {
  overview: () => apiClient.get<OrganizationOverview>("/organization"),
  departments: () => apiClient.get<DepartmentAggregate[]>("/departments"),
  trends: () => apiClient.get<{ trend: { label: string; value: number }[] }>("/organization/trends"),
};
