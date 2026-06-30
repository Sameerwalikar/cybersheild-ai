import { apiClient } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: "citizen" | "police" | "organization";
}

export interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

export const authApi = {
  login: (data: LoginRequest) => apiClient.post<AuthResponse>("/auth/login", data),
  register: (data: RegisterRequest) => apiClient.post<AuthResponse>("/auth/register", data),
  logout: () => apiClient.post("/auth/logout"),
  me: () => apiClient.get<AuthResponse["user"]>("/auth/me"),
  refresh: () => apiClient.post<{ token: string }>("/auth/refresh"),
};
