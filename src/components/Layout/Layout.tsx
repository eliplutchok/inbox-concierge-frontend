import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { useEmails } from "../../context/EmailContext";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useEmails();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <span className={styles.menuIcon} />
            <span className={styles.menuIcon} />
            <span className={styles.menuIcon} />
          </button>
          <span className={styles.logo}>Inbox Concierge</span>
        </div>
        <div className={styles.userSection}>
          {user && <span className={styles.userEmail}>{user.email}</span>}
          <button className={styles.signOutBtn} onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <div className={styles.body}>
        {sidebarOpen && (
          <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
        )}
        {children}
      </div>
    </div>
  );
}
