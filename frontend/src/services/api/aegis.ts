const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

async function request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: "include",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.data as T;
}

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ConversationFull {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  conversationId: string;
  message: ChatMessage;
}

export const aegisApi = {
  getConversations: () => request<ConversationSummary[]>("GET", "/aegis/conversations"),
  getConversation: (id: string) => request<ConversationFull>("GET", `/aegis/conversations/${id}`),
  chat: (message: string, conversationId?: string) => request<ChatResponse>("POST", "/aegis/chat", { message, conversationId }),
  deleteConversation: (id: string) => request<any>("DELETE", `/aegis/conversations/${id}`),
  renameConversation: (id: string, title: string) => request<any>("PATCH", `/aegis/conversations/${id}`, { title }),
};
