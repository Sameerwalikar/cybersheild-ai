import { create } from "zustand";

type Role = "citizen" | "police" | "organization" | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (user: User, accessToken: string) => void;
  logout: () => void;
  restoreSession: () => void;
  setLoading: (loading: boolean) => void;
}

/** Read session synchronously from localStorage (client-only). */
function readStoredSession(): Pick<AuthState, "user" | "accessToken" | "isAuthenticated" | "isLoading"> {
  if (typeof window === "undefined") {
    // SSR — no session available yet
    return { user: null, accessToken: null, isAuthenticated: false, isLoading: false };
  }
  try {
    const token   = localStorage.getItem("accessToken");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      const user = JSON.parse(userStr) as User;
      return { user, accessToken: token, isAuthenticated: true, isLoading: false };
    }
  } catch {
    // corrupted storage — clear it
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  }
  return { user: null, accessToken: null, isAuthenticated: false, isLoading: false };
}

export const useAuthStore = create<AuthState>((set) => ({
  // ── Eagerly restore session on store creation — eliminates the extra
  // render cycle caused by calling restoreSession() in a useEffect. ──
  ...readStoredSession(),

  login: (user, accessToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  // Kept for backward compat — now a no-op since init is eager
  restoreSession: () => {
    const session = readStoredSession();
    set(session);
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
