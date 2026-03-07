import { useEmails } from "../../context/EmailContext";
import styles from "./Toast.module.css";

export default function Toast() {
  const { toast, dismissToast } = useEmails();

  if (!toast) return null;

  return (
    <div className={styles.toast} onClick={dismissToast}>
      <svg className={styles.icon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      <span>{toast}</span>
    </div>
  );
}
