import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../services/api";
import { useEmails } from "../../context/EmailContext";
import type { CategoryUpdate } from "../../types";
import styles from "./CategoryModal.module.css";

interface CategoryModalProps {
  onClose: () => void;
}

interface EditableCategory {
  id: string | null;
  name: string;
  description: string;
}

export default function CategoryModal({ onClose }: CategoryModalProps) {
  const { categories, updateCategories, resetCategories } = useEmails();
  const [items, setItems] = useState<EditableCategory[]>(() =>
    categories.map((c) => ({ id: c.id, name: c.name, description: c.description || "" }))
  );
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(true);

  const initialItemsRef = useRef(
    categories.map((c) => ({ id: c.id, name: c.name, description: c.description || "" }))
  );
  const initialNotesRef = useRef<string>("");

  useEffect(() => {
    api.getNotes().then((res) => {
      const loaded = res.notes || "";
      setNotes(loaded);
      initialNotesRef.current = loaded;
      setNotesLoading(false);
    }).catch(() => setNotesLoading(false));
  }, []);

  const hasChanges = useMemo(() => {
    const initial = initialItemsRef.current;
    if (items.length !== initial.length) return true;
    for (let i = 0; i < items.length; i++) {
      if (
        items[i].id !== initial[i].id ||
        items[i].name !== initial[i].name ||
        items[i].description !== initial[i].description
      )
        return true;
    }
    if (notes !== initialNotesRef.current) return true;
    return false;
  }, [items, notes]);

  const handleDelete = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAdd = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setItems((prev) => [
      ...prev,
      { id: null, name: trimmed, description: newDesc.trim() },
    ]);
    setNewName("");
    setNewDesc("");
  }, [newName, newDesc]);

  const handleSave = useCallback(async (reclassify: boolean) => {
    const valid = items.filter((i) => i.name.trim());
    if (valid.length === 0) return;
    const mapped: CategoryUpdate[] = valid.map((i) => ({
      id: i.id,
      name: i.name.trim(),
      description: i.description.trim() || null,
    }));

    const trimmedNotes = notes.trim() || null;
    await api.updateNotes(trimmedNotes);

    const success = await updateCategories(mapped, reclassify);
    if (success) onClose();
  }, [items, notes, updateCategories, onClose]);

  const handleReset = useCallback(async () => {
    const success = await resetCategories();
    if (success) onClose();
  }, [resetCategories, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>Manage Categories</div>
        <div className={styles.body}>
          {items.map((item, i) => (
            <div key={item.id || `new-${i}`} className={styles.categoryRow}>
              <input
                className={styles.nameInput}
                value={item.name}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((it, idx) =>
                      idx === i ? { ...it, name: e.target.value } : it
                    )
                  )
                }
                placeholder="Category name"
              />
              <input
                className={styles.descInput}
                value={item.description}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((it, idx) =>
                      idx === i ? { ...it, description: e.target.value } : it
                    )
                  )
                }
                placeholder="Description (optional)"
              />
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(i)}
                title="Delete category"
              >
                ×
              </button>
            </div>
          ))}
          <div className={styles.addSection}>
            <input
              className={styles.nameInput}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <input
              className={styles.descInput}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button className={styles.addBtn} onClick={handleAdd}>
              Add
            </button>
          </div>

          <div className={styles.notesSection}>
            <div className={styles.notesHeader}>
              <svg className={styles.aiIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span>AI Preference Notes</span>
            </div>
            <p className={styles.notesHint}>
              Auto-generated by AI from your reclassifications. The AI uses these to improve future sorting. Feel free to edit, add, or remove notes.
            </p>
            {notesLoading ? (
              <div className={styles.notesLoading}>Loading...</div>
            ) : (
              <textarea
                className={styles.notesInput}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="No preference notes yet. Reclassify emails to teach the AI your preferences."
                rows={5}
              />
            )}
          </div>
        </div>
        <div className={styles.footer}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset to Defaults
          </button>
          <div className={styles.footerRight}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              className={styles.saveBtn}
              onClick={() => handleSave(false)}
              disabled={!hasChanges}
            >
              Save
            </button>
            <button
              className={styles.reclassifyBtn}
              onClick={() => handleSave(true)}
              disabled={!hasChanges}
            >
              Save &amp; Recategorize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
