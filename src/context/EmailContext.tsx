import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api";
import type { Category, EmailThread } from "../types";

interface EmailContextValue {
  emails: EmailThread[];
  categories: Category[];
  activeCategory: string | null;
  loading: boolean;
  error: string | null;
  setActiveCategory: (id: string | null) => void;
  fetchEmails: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  moveEmail: (emailId: string, classificationId: string, newCategoryId: string) => Promise<void>;
  updateCategories: (categories: Category[]) => Promise<void>;
  resetCategories: () => Promise<void>;
}

const EmailContext = createContext<EmailContextValue | null>(null);

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
      if (!activeCategory && cats.length > 0) {
        setActiveCategory(cats[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    }
  }, [activeCategory]);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [emailsRes] = await Promise.all([api.getEmails(), fetchCategories()]);
      setEmails(emailsRes.emails);
      // Ensure we also have up-to-date categories
      const cats = await api.getCategories();
      setCategories(cats);
      if (!activeCategory && cats.length > 0) {
        setActiveCategory(cats[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch emails");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, fetchCategories]);

  const moveEmail = useCallback(
    async (emailId: string, classificationId: string, newCategoryId: string) => {
      const newCategory = categories.find((c) => c.id === newCategoryId);
      if (!newCategory) return;

      // Optimistic update
      setEmails((prev) =>
        prev.map((e) =>
          e.id === emailId
            ? { ...e, category_id: newCategoryId, category_name: newCategory.name, is_user_corrected: true }
            : e
        )
      );

      try {
        await api.updateClassification(classificationId, newCategoryId);
      } catch {
        // Revert on failure
        await fetchEmails();
      }
    },
    [categories, fetchEmails]
  );

  const updateCategories = useCallback(
    async (updatedCats: Category[]) => {
      setLoading(true);
      try {
        const result = await api.updateCategories(
          updatedCats.map((c) => ({
            id: c.id || null,
            name: c.name,
            description: c.description,
          }))
        );
        setCategories(result);
        if (result.length > 0 && !result.find((c) => c.id === activeCategory)) {
          setActiveCategory(result[0].id);
        }
        // Reclassification happens in background — refetch emails after a delay
        setTimeout(async () => {
          try {
            const emailsRes = await api.getEmails();
            setEmails(emailsRes.emails);
          } catch {
            // silent
          }
          setLoading(false);
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update categories");
        setLoading(false);
      }
    },
    [activeCategory]
  );

  const resetCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.resetCategories();
      setCategories(result);
      if (result.length > 0) setActiveCategory(result[0].id);
      setTimeout(async () => {
        try {
          const emailsRes = await api.getEmails();
          setEmails(emailsRes.emails);
        } catch {
          // silent
        }
        setLoading(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset categories");
      setLoading(false);
    }
  }, []);

  return (
    <EmailContext.Provider
      value={{
        emails,
        categories,
        activeCategory,
        loading,
        error,
        setActiveCategory,
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
