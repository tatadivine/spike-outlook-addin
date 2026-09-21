import { apiClient } from "./client";
import type { Evidence } from "@/lib/types";

export const evidenceApi = {
  list: () => apiClient.get<Evidence[]>("/evidence"),
};
