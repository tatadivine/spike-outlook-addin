import { apiClient } from "./client";
import type { Commitment } from "@/lib/types";

export const commitmentsApi = {
  list: (ownerId?: string) => apiClient.get<Commitment[]>("/commitments", { owner_id: ownerId }),
};
