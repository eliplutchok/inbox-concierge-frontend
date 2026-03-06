import { useMemo, useState } from "react";
import { useEmails } from "../../context/EmailContext";
import CategoryModal from "../CategoryModal/CategoryModal";
import CategoryTab from "./CategoryTab";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const { categories, emails, activeCategory, setActiveCategory, sidebarOpen, setSidebarOpen } = useEmails();
  const [modalOpen, setModalOpen] = useState(false);

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      counts[cat.id] = 0;
    }
    for (const email of emails) {
      if (email.category_id && counts[email.category_id] !== undefined) {
        counts[email.category_id]++;
      }
    }
    return counts;
  }, [categories, emails]);

  const handleCategoryClick = (catId: string | null) => {
    setActiveCategory(catId);
    setSidebarOpen(false);
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.tabs}>
          <div
            className={`${styles.allTab} ${activeCategory === null ? styles.allTabActive : ""}`}
            onClick={() => handleCategoryClick(null)}
          >
            <span className={styles.allTabName}>All</span>
            <span className={styles.allTabCount}>{emails.length}</span>
          </div>
          {categories.map((cat) => (
            <CategoryTab
              key={cat.id}
              id={cat.id}
              name={cat.name}
              count={countsByCategory[cat.id] || 0}
              active={activeCategory === cat.id}
              onClick={() => handleCategoryClick(cat.id)}
            />
          ))}
        </div>
        <div className={styles.footer}>
          <button className={styles.manageBtn} onClick={() => setModalOpen(true)}>
            Manage Categories
          </button>
        </div>
      </aside>
      {modalOpen && <CategoryModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
