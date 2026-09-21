import { apiClient } from "./client";

export interface ReportSummary {
  id: string;
  title: string;
  description: string;
}

export const reportsApi = {
  list: () => apiClient.get<ReportSummary[]>("/reports"),
};
