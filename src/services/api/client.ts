const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, signal } = config;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(errorData.message || `HTTP ${res.status}`, res.status);
  }

  const data = await res.json();
  return { data, status: res.status, ok: true };
}

export const apiClient = {
  get: <T>(endpoint: string, config?: Omit<RequestConfig, "method" | "body">) =>
    request<T>(endpoint, { ...config, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, "method" | "body">) =>
    request<T>(endpoint, { ...config, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, "method" | "body">) =>
    request<T>(endpoint, { ...config, method: "PUT", body }),

  patch: <T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, "method" | "body">) =>
    request<T>(endpoint, { ...config, method: "PATCH", body }),

  delete: <T>(endpoint: string, config?: Omit<RequestConfig, "method" | "body">) =>
    request<T>(endpoint, { ...config, method: "DELETE" }),
};

export { ApiError };
