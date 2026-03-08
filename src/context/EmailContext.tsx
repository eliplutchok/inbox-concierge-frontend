import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api";
import type { CategoryUpdate, EmailThread, Category } from "../types";

interface EmailContextValue {
  emails: EmailThread[];
  categories: Category[];
  activeCategory: string;
  searchQuery: string;
  toast: string | null;
  loading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setActiveCategory: (id: string) => void;
  setSearchQuery: (query: string) => void;
  dismissToast: () => void;
  clearError: () => void;
  fetchEmails: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  moveEmail: (emailId: string, newCategoryId: string) => Promise<void>;
  updateCategories: (categories: CategoryUpdate[], reclassify?: boolean) => Promise<boolean>;
  resetCategories: () => Promise<boolean>;
  reclassifyEmails: () => Promise<void>;
}

const EmailContext = createContext<EmailContextValue | null>(null);

const ACTIVE_CAT_KEY = "inbox-concierge-active-category";

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(
    () => localStorage.getItem(ACTIVE_CAT_KEY) ?? ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (activeCategory) localStorage.setItem(ACTIVE_CAT_KEY, activeCategory);
  }, [activeCategory]);

  const showToast = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const syncActiveCategory = useCallback((newCats: Category[]) => {
    setActiveCategory((prev) => {
      if (prev === "all") return "all";
      if (prev && newCats.some((c) => c.id === prev)) return prev;
      return newCats[0]?.id ?? "all";
    });
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
      syncActiveCategory(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    }
  }, [syncActiveCategory]);

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
        showToast("Feedback received — your preferences will be updated.");
      } catch {
        setEmails(previousEmails);
        setError("Failed to move email. Please try again.");
      }
    },
    [categories, emails, showToast]
  );

  const reclassifyEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.reclassifyEmails();
      setEmails(res.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reclassify emails");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCategories = useCallback(
    async (updatedCats: CategoryUpdate[], reclassify = false): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.updateCategories(updatedCats);
        setCategories(result);
        syncActiveCategory(result);
        if (reclassify) {
          const res = await api.reclassifyEmails(true);
          setEmails(res.emails);
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update categories");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [syncActiveCategory]
  );

  const resetCategories = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.resetCategories();
      setCategories(result);
      syncActiveCategory(result);
      const res = await api.reclassifyEmails(true);
      setEmails(res.emails);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset categories");
      return false;
    } finally {
      setLoading(false);
    }
  }, [syncActiveCategory]);

  return (
    <EmailContext.Provider
      value={{
        emails,
        categories,
        activeCategory,
        searchQuery,
        toast,
        loading,
        error,
        sidebarOpen,
        setSidebarOpen,
        setActiveCategory,
        setSearchQuery,
        dismissToast,
        clearError,
        fetchEmails,
        fetchCategories,
        moveEmail,
        updateCategories,
        resetCategories,
        reclassifyEmails,
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
