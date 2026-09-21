import { apiClient } from "./client";
import type { AlertItem } from "@/lib/types";

export interface OutlookCoachPayload {
  response_score: number;
  alerts: AlertItem[];
  positive_followthrough: string;
}

export const outlookApi = {
  get: () => apiClient.get<OutlookCoachPayload>("/outlook"),
};
