import styles from "./Loader.module.css";

interface LoaderProps {
  message?: string;
}

export default function Loader({ message = "Hang on, crunching the data..." }: LoaderProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.dots}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
      <span className={styles.message}>{message}</span>
    </div>
  );
}
