import { apiClient } from "./client";
import type { Employee } from "@/lib/types";

export const teamApi = {
  list: () => apiClient.get<Employee[]>("/team"),
  get: (employeeId: string) => apiClient.get<Employee>(`/team/${employeeId}`),
  trends: () => apiClient.get<{ response_score: number; sla_compliance: number; overdue: number; headcount: number }>("/team/trends"),
};
