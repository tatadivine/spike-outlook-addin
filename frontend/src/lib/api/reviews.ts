import { apiClient } from "./client";
import type { Review } from "@/lib/types";

export const reviewsApi = {
  list: () => apiClient.get<Review[]>("/reviews"),
  decide: (id: string, decision: "confirmed" | "dismissed" | "needs_context") =>
    apiClient.patch<Review>(`/reviews/${id}`, { decision }),
};
