import { apiClient } from "./client";
import type { AlertItem } from "@/lib/types";

export const alertsApi = {
  list: (ownerId?: string) => apiClient.get<AlertItem[]>("/alerts", { owner_id: ownerId }),
};
