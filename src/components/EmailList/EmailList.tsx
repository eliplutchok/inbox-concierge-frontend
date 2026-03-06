import { useMemo } from "react";
import { useEmails } from "../../context/EmailContext";
import Loader from "../Loader/Loader";
import EmailItem from "./EmailItem";
import styles from "./EmailList.module.css";

export default function EmailList() {
  const { emails, activeCategory, loading, error, clearError } = useEmails();

  const filteredEmails = useMemo(
    () => emails.filter((e) => e.category_id === activeCategory),
    [emails, activeCategory]
  );

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
      {filteredEmails.map((email) => (
        <EmailItem key={email.id} email={email} />
      ))}
    </div>
  );
}
