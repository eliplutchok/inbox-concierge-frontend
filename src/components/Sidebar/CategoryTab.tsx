import { useDroppable } from "@dnd-kit/react";
import styles from "./CategoryTab.module.css";

interface CategoryTabProps {
  id: string;
  name: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

export default function CategoryTab({ id, name, count, active, onClick }: CategoryTabProps) {
  const { ref, isDropTarget } = useDroppable({ id });

  return (
    <div
      ref={ref}
      className={`${styles.tab} ${active ? styles.active : ""} ${isDropTarget ? styles.dropOver : ""}`}
      onClick={onClick}
    >
      <span className={styles.name}>{name}</span>
      <span className={styles.count}>{count}</span>
    </div>
  );
}
