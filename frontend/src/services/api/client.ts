const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
}

class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code = "UNKNOWN") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setAccessToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem("accessToken", token);
}

export function clearAccessToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem("accessToken");
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { method = "GET", body, headers = {}, signal } = config;

  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal,
  });

  const json = await res.json().catch(() => ({ success: false, error: "Network error" }));

  if (!res.ok) {
    throw new ApiError(json.error || `HTTP ${res.status}`, res.status, json.code);
  }

  return json.data as T;
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
