import { apiClient, setAccessToken, clearAccessToken } from "./client";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export const authApi = {
  async register(data: { name: string; email: string; password: string; role: string }): Promise<LoginResponse> {
    const result = await apiClient.post<LoginResponse>("/auth/register", data);
    setAccessToken(result.accessToken);
    return result;
  },

  async login(data: { email: string; password: string }): Promise<LoginResponse> {
    const result = await apiClient.post<LoginResponse>("/auth/login", data);
    setAccessToken(result.accessToken);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      clearAccessToken();
    }
  },

  async refresh(): Promise<{ accessToken: string }> {
    const result = await apiClient.post<{ accessToken: string }>("/auth/refresh");
    setAccessToken(result.accessToken);
    return result;
  },

  async me(): Promise<AuthUser & { isVerified: boolean; createdAt: string }> {
    return apiClient.get("/auth/me");
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post("/auth/forgot-password", { email });
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiClient.post("/auth/reset-password", { token, password });
  },
};
