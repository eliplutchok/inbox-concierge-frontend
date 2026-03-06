import { useCallback, useEffect, useState } from "react";
import { useEmails } from "../../context/EmailContext";
import type { Category } from "../../types";
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
  const [items, setItems] = useState<EditableCategory[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    setItems(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
      }))
    );
  }, [categories]);

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

  const handleSave = useCallback(async () => {
    const valid = items.filter((i) => i.name.trim());
    if (valid.length === 0) return;
    const success = await updateCategories(
      valid.map((i) => ({
        id: i.id || "",
        name: i.name.trim(),
        description: i.description.trim() || null,
      })) as Category[]
    );
    if (success) onClose();
  }, [items, updateCategories, onClose]);

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
        </div>
        <div className={styles.footer}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset to Defaults
          </button>
          <div className={styles.footerRight}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.saveBtn} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
