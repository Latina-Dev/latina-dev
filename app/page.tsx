import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import Logo from "@/components/Logo/Logo";
import Link from "next/link";
import { description, title } from "./head";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <GitHubCorner />
      <div className={styles.container}>
        <div className={styles.center}>
          <div className={styles.logoContainer}>
            <Logo className={styles.logo} />
          </div>
          <Link
            href="https://github.com/FrancesCoronel/latina-dev"
            aria-label="Latina Dev"
            target={"_blank"}
            className={styles.nameLink}
          >
            <h1>{title}</h1>
          </Link>
          <div className={styles.description}>
            <p>{description}</p>
            <br />
            <p>More to come soon...</p>
          </div>
        </div>
      </div>
    </main>
  );
}
