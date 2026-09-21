import { apiClient } from "./client";
import type { FollowUp } from "@/lib/types";

export const followupsApi = {
  list: (ownerId?: string) => apiClient.get<FollowUp[]>("/followups", { owner_id: ownerId }),
};
