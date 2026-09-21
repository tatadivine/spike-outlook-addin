import type { ApiErrorBody } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiClientError extends Error {
  code: string;
  status: number;
  requestId?: string;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export interface DemoIdentityHeaders {
  accountType: "employee" | "administrator";
  employeeId: string | null;
}

let currentIdentity: DemoIdentityHeaders = { accountType: "employee", employeeId: null };

/** Called by SessionProvider whenever the demo identity changes, so every
 * API call automatically carries the current caller's identity headers —
 * this is the one seam that gets replaced by a real Authorization: Bearer
 * <Entra ID token> header once real auth ships. */
export function setDemoIdentity(identity: DemoIdentityHeaders) {
  currentIdentity = identity;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  params?: Record<string, string | undefined | null>;
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Demo-Account-Type": currentIdentity.accountType,
  };
  if (currentIdentity.employeeId) headers["X-Demo-Employee-Id"] = currentIdentity.employeeId;

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = await res.json();
    } catch {
      // ignore — fall through to generic error below
    }
    throw new ApiClientError(
      res.status,
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ?? `Request failed with status ${res.status}`,
      body?.error?.request_id
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, params?: Record<string, string | undefined | null>) =>
    request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
};
