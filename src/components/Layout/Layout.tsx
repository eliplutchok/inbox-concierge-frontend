import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.logo}>Inbox Concierge</span>
        <div className={styles.userSection}>
          {user && <span className={styles.userEmail}>{user.email}</span>}
          <button className={styles.signOutBtn} onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
