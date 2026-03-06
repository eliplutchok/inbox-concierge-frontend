import { useDraggable } from "@dnd-kit/react";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useEmails } from "../../context/EmailContext";
import type { EmailThread } from "../../types";
import styles from "./EmailItem.module.css";

interface EmailItemProps {
  email: EmailThread;
  showCategory?: boolean;
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

const NEW_THRESHOLD_MS = 30_000;
const NEW_FADE_DELAY_MS = 3_000;

export default function EmailItem({ email, showCategory }: EmailItemProps) {
  const { categories, moveEmail } = useEmails();
  const [menuOpen, setMenuOpen] = useState(false);
  const { ref, isDragging } = useDraggable({
    id: email.id,
    data: {
      emailId: email.id,
      currentCategoryId: email.category_id,
    },
  });

  const isNew = useMemo(() => {
    if (!email.classified_at) return false;
    return Date.now() - new Date(email.classified_at).getTime() < NEW_THRESHOLD_MS;
  }, [email.classified_at]);

  const [showNew, setShowNew] = useState(isNew);

  useEffect(() => {
    if (!showNew) return;
    const timer = setTimeout(() => setShowNew(false), NEW_FADE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [showNew]);

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
          <span className={styles.badgeSlot}>
            {isNew && (
              <span className={`${styles.newBadge} ${showNew ? "" : styles.newBadgeFaded}`}>
                New
              </span>
            )}
          </span>
          {showCategory && email.category_name && (
            <span className={styles.categoryPill}>{email.category_name}</span>
          )}
          <span className={styles.subjectLine}>
            <span className={styles.subject}>{email.subject || "(no subject)"}</span>
            {email.snippet && (
              <>
                <span className={styles.snippetDash}> — </span>
                <span className={styles.snippet}>{email.snippet}</span>
              </>
            )}
          </span>
          <span className={styles.date}>{formatDate(email.date)}</span>
        </div>
        {email.snippet && (
          <div className={styles.mobileSnippet}>{email.snippet}</div>
        )}
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
