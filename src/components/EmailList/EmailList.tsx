import { useCallback, useMemo, useState } from "react";
import { useEmails } from "../../context/EmailContext";
import Loader from "../Loader/Loader";
import EmailItem from "./EmailItem";
import styles from "./EmailList.module.css";

const TIP_DISMISSED_KEY = "inbox-concierge-tip-dismissed";

function useTipBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(TIP_DISMISSED_KEY) === "1"
  );

  const dismiss = useCallback(() => {
    localStorage.setItem(TIP_DISMISSED_KEY, "1");
    setDismissed(true);
  }, []);

  return { show: !dismissed, dismiss };
}

export default function EmailList() {
  const { emails, activeCategory, searchQuery, loading, error, clearError } = useEmails();
  const tip = useTipBanner();

  const showAll = activeCategory === null;

  const filteredEmails = useMemo(() => {
    let result = showAll ? emails : emails.filter((e) => e.category_id === activeCategory);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.subject?.toLowerCase().includes(q) ||
          e.sender?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [emails, activeCategory, showAll, searchQuery]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <button onClick={clearError} className={styles.dismissBtn}>Dismiss</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Loader />
      </div>
    );
  }

  if (filteredEmails.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No emails in this category</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {tip.show && (
        <div className={styles.tipBanner}>
          <span>Hi! Drag emails to a category or use the reclassify icon to move them. Each correction teaches the AI your preferences, so classifications get smarter over time.</span>
          <button onClick={tip.dismiss} className={styles.tipDismiss}>Got it</button>
        </div>
      )}
      {filteredEmails.map((email) => (
        <EmailItem key={email.id} email={email} showCategory={showAll} />
      ))}
    </div>
  );
}
