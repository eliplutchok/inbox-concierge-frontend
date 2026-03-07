import type { Category, CategoryUpdate, EmailsResponse, User } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
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

  getMe: () => request<User>("/api/auth/me"),

  getEmails: () => request<EmailsResponse>("/api/emails"),

  getCategories: () => request<Category[]>("/api/categories"),

  updateCategories: (categories: CategoryUpdate[]) =>
    request<Category[]>("/api/categories", {
      method: "PUT",
      body: JSON.stringify({ categories }),
    }),

  resetCategories: () =>
    request<Category[]>("/api/categories/reset", {
      method: "POST",
    }),

  updateEmailCategory: (emailId: string, categoryId: string) =>
    request<{ status: string }>(`/api/emails/${emailId}/category`, {
      method: "PATCH",
      body: JSON.stringify({ category_id: categoryId }),
    }),

  getNotes: () => request<{ notes: string | null }>("/api/categories/notes"),

  updateNotes: (notes: string | null) =>
    request<{ notes: string | null }>("/api/categories/notes", {
      method: "PUT",
      body: JSON.stringify({ notes }),
    }),
};
