import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { useEmails } from "../../context/EmailContext";
import Toast from "../Toast/Toast";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery, reclassifyEmails, loading } = useEmails();

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
          <img src="/icon.svg" alt="" className={styles.logoIcon} />
          <span className={styles.logo}>Inbox Concierge</span>
        </div>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className={styles.searchClear}
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <div className={styles.userSection}>
          {user && <span className={styles.userEmail}>{user.email}</span>}
          <button
            className={styles.recategorizeBtn}
            onClick={reclassifyEmails}
            disabled={loading}
            title="Re-run AI classification on all emails using your current categories and preference notes"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
            </svg>
            <span>Recategorize</span>
          </button>
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
      <Toast />
    </div>
  );
}
