import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api";
import type { CategoryUpdate, EmailThread, Category } from "../types";

interface EmailContextValue {
  emails: EmailThread[];
  categories: Category[];
  activeCategory: string | null;
  loading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setActiveCategory: (id: string | null) => void;
  clearError: () => void;
  fetchEmails: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  moveEmail: (emailId: string, newCategoryId: string) => Promise<void>;
  updateCategories: (categories: CategoryUpdate[]) => Promise<boolean>;
  resetCategories: () => Promise<boolean>;
}

const EmailContext = createContext<EmailContextValue | null>(null);

const ACTIVE_CAT_KEY = "inbox-concierge-active-category";

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_CAT_KEY) || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (activeCategory) {
      localStorage.setItem(ACTIVE_CAT_KEY, activeCategory);
    } else {
      localStorage.removeItem(ACTIVE_CAT_KEY);
    }
  }, [activeCategory]);

  const clearError = useCallback(() => setError(null), []);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
      setActiveCategory((prev) => {
        if (prev === null) return null;
        if (cats.some((c) => c.id === prev)) return prev;
        return null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    }
  }, []);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEmails();
      setEmails(res.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch emails");
    } finally {
      setLoading(false);
    }
  }, []);

  const moveEmail = useCallback(
    async (emailId: string, newCategoryId: string) => {
      const newCategory = categories.find((c) => c.id === newCategoryId);
      if (!newCategory) return;

      const previousEmails = emails;

      setEmails((prev) =>
        prev.map((e) =>
          e.id === emailId
            ? { ...e, category_id: newCategoryId, category_name: newCategory.name, is_user_corrected: true }
            : e
        )
      );

      try {
        await api.updateEmailCategory(emailId, newCategoryId);
      } catch {
        setEmails(previousEmails);
        setError("Failed to move email. Please try again.");
      }
    },
    [categories, emails]
  );

  const refreshEmailsAfterDelay = useCallback(() => {
    setTimeout(async () => {
      try {
        const res = await api.getEmails();
        setEmails(res.emails);
      } catch {
        // emails will refresh on next interaction
      }
      setLoading(false);
    }, 3000);
  }, []);

  const updateCategories = useCallback(
    async (updatedCats: CategoryUpdate[]): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.updateCategories(updatedCats);
        setCategories(result);
        setActiveCategory((prev) => {
          if (prev === null) return null;
          if (result.some((c) => c.id === prev)) return prev;
          return null;
        });
        refreshEmailsAfterDelay();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update categories");
        setLoading(false);
        return false;
      }
    },
    [refreshEmailsAfterDelay]
  );

  const resetCategories = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.resetCategories();
      setCategories(result);
      setActiveCategory(null);
      refreshEmailsAfterDelay();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset categories");
      setLoading(false);
      return false;
    }
  }, [refreshEmailsAfterDelay]);

  return (
    <EmailContext.Provider
      value={{
        emails,
        categories,
        activeCategory,
        loading,
        error,
        sidebarOpen,
        setSidebarOpen,
        setActiveCategory,
        clearError,
        fetchEmails,
        fetchCategories,
        moveEmail,
        updateCategories,
        resetCategories,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
}

export function useEmails() {
  const ctx = useContext(EmailContext);
  if (!ctx) throw new Error("useEmails must be used within EmailProvider");
  return ctx;
}
