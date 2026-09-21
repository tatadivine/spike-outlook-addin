import { apiClient } from "./client";
import type { AIInsight } from "@/lib/types";

export const coachingApi = {
  list: (employeeId?: string) => apiClient.get<AIInsight[]>("/coaching", { employee_id: employeeId }),
};
