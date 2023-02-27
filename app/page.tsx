import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import Logo from "@/components/Logo/Logo";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import { description, title } from "./head";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <GitHubCorner />
      <div className={styles.container}>
        <div className={styles.center}>
          <Navbar />
          <section className={styles.home} id="home">
            <div className={styles.logoContainer}>
              <Logo />
            </div>
            <h1>{title}</h1>
            <div className={styles.description}>
              <p>{description}</p>
            </div>
            <Link
              href="https://github.com/FrancesCoronel/latina-dev"
              aria-label="Latina Dev"
              target={"_blank"}
              className={styles.contributeLink}
            >
              Contribute
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
