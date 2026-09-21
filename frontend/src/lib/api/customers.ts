import { apiClient } from "./client";
import type { Customer } from "@/lib/types";

export const customersApi = {
  list: () => apiClient.get<Customer[]>("/customers"),
  get: (id: string) => apiClient.get<Customer>(`/customers/${id}`),
};
