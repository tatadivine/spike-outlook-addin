import { apiClient } from "./client";
import type { DashboardView, RosterEmployee } from "@/lib/types";

export const dashboardApi = {
  get: (viewAs?: string) => apiClient.get<DashboardView>("/dashboard", { view_as: viewAs }),
  roster: () => apiClient.get<RosterEmployee[]>("/dashboard/roster"),
};
