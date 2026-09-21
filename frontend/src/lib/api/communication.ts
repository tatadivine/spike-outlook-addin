import { apiClient } from "./client";
import type { Communication } from "@/lib/types";

export const communicationApi = {
  list: (ownerId?: string) => apiClient.get<Communication[]>("/communications", { owner_id: ownerId }),
  get: (id: string) => apiClient.get<Communication>(`/communications/${id}`),
};
