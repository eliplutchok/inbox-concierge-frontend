import { useDraggable } from "@dnd-kit/react";
import { format, parseISO } from "date-fns";
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
  const { ref, isDragging } = useDraggable({
    id: email.id,
    data: {
      emailId: email.id,
      currentCategoryId: email.category_id,
    },
  });

  return (
    <div
      ref={ref}
      className={`${styles.item} ${isDragging ? styles.dragging : ""} ${email.is_user_corrected ? styles.corrected : ""}`}
    >
      <div className={styles.content}>
        <div className={styles.subjectRow}>
          <span className={styles.sender}>{formatSender(email.sender)}</span>
          <span className={styles.subject}>{email.subject || "(no subject)"}</span>
          <span className={styles.date}>{formatDate(email.date)}</span>
        </div>
        <div className={styles.snippetRow}>
          <span className={styles.snippet}>{email.snippet}</span>
        </div>
      </div>
      <a
        href={email.gmail_link}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.openBtn}
        onClick={(e) => e.stopPropagation()}
      >
        Open in Gmail
      </a>
    </div>
  );
}
