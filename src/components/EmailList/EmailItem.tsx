import { useDraggable } from "@dnd-kit/react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { useEmails } from "../../context/EmailContext";
import type { EmailThread } from "../../types";
import styles from "./EmailItem.module.css";

interface EmailItemProps {
  email: EmailThread;
}

function formatSender(sender: string | null): string {
  if (!sender) return "Unknown";
  const match = sender.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : sender.split("@")[0];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "MMM d");
  } catch {
    return "";
  }
}

export default function EmailItem({ email }: EmailItemProps) {
  const { categories, moveEmail } = useEmails();
  const [menuOpen, setMenuOpen] = useState(false);
  const { ref, isDragging } = useDraggable({
    id: email.id,
    data: {
      emailId: email.id,
      currentCategoryId: email.category_id,
    },
  });

  const handleRowClick = () => {
    if (email.gmail_link) {
      window.open(email.gmail_link, "_blank", "noopener,noreferrer");
    }
  };

  const handleReclassify = (categoryId: string) => {
    moveEmail(email.id, categoryId);
    setMenuOpen(false);
  };

  const otherCategories = categories.filter((c) => c.id !== email.category_id);

  return (
    <div
      ref={ref}
      className={`${styles.item} ${isDragging ? styles.dragging : ""} ${menuOpen ? styles.menuActive : ""}`}
      onClick={handleRowClick}
    >
      <div className={styles.content}>
        <div className={styles.topRow}>
          <span className={styles.sender}>{formatSender(email.sender)}</span>
          <span className={styles.subject}>{email.subject || "(no subject)"}</span>
          <span className={styles.date}>{formatDate(email.date)}</span>
        </div>
        <div className={styles.bottomRow}>
          <span className={styles.snippet}>{email.snippet}</span>
        </div>
      </div>
      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
        <div className={styles.reclassifyWrapper}>
          <button
            className={styles.reclassifyBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Move to category"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h14M14 4l4 4-4 4" />
              <path d="M20 16H6M10 12l-4 4 4 4" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)} />
              <div className={styles.menu}>
                {otherCategories.map((c) => (
                  <button
                    key={c.id}
                    className={styles.menuItem}
                    onClick={() => handleReclassify(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <a
          href={email.gmail_link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openBtn}
        >
          Open in Gmail
        </a>
      </div>
    </div>
  );
}
