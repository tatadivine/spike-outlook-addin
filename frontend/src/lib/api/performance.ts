import { apiClient } from "./client";
import type { Commitment, Employee, FollowUp } from "@/lib/types";

export interface PerformancePayload {
  employee: Employee;
  commitments: Commitment[];
  follow_ups: FollowUp[];
}

export const performanceApi = {
  get: () => apiClient.get<PerformancePayload>("/performance"),
};
