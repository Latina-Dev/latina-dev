import styles from "./PageHero.module.css";

interface Props {
  title: React.ReactNode; // rendered as the page's h1
  eyebrow?: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode; // search box, stats, breadcrumb...
  before?: React.ReactNode; // shown above the eyebrow, e.g. a breadcrumb
}

/** The red band under the masthead that opens every page */
export default function PageHero({ title, eyebrow, lede, children, before }: Props) {
  return (
    <section className={styles.hero}>
      <div className={`page-width ${styles.inner}`}>
        {before}
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h1 className={styles.title}>{title}</h1>
        {lede && <div className={styles.lede}>{lede}</div>}
        {children}
      </div>
    </section>
  );
}
