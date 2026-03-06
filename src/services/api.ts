const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  getLoginUrl: () => `${API_URL}/api/auth/login`,

  getMe: () => request<{ id: string; email: string; name: string | null }>("/api/auth/me"),

  getEmails: () =>
    request<{
      emails: import("../types").EmailThread[];
      classified_count: number;
      total_count: number;
    }>("/api/emails"),

  getCategories: () => request<import("../types").Category[]>("/api/categories"),

  updateCategories: (categories: import("../types").CategoryUpdate[]) =>
    request<import("../types").Category[]>("/api/categories", {
      method: "PUT",
      body: JSON.stringify({ categories }),
    }),

  resetCategories: () =>
    request<import("../types").Category[]>("/api/categories/reset", {
      method: "POST",
    }),

  updateClassification: (classificationId: string, categoryId: string) =>
    request<{ status: string }>(`/api/classifications/${classificationId}`, {
      method: "PATCH",
      body: JSON.stringify({ category_id: categoryId }),
    }),
};
