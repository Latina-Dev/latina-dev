import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import { Inter } from "@next/font/google";
import Image from "next/image";
import Link from "next/link";
import { description, title } from "./head";
import styles from "./page.module.css";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className={styles.main}>
      <GitHubCorner />
      <div className={styles.container}>
        <div className={styles.center}>
          <div className={styles.logo}>
            <Image
              src="/img/logos/logo-white.svg"
              alt="Latina Dev Logo"
              width={35}
              height={66}
            />
          </div>
          <Link
            href="https://github.com/FrancesCoronel/latina-dev"
            aria-label="Latina Dev"
            target={"_blank"}
            className={styles.nameLink}
          >
            <h1 className={inter.className}>{title}</h1>
          </Link>
          <div className={styles.description}>
            <p className={inter.className}>{description}</p>
            <br />
            <p className={inter.className}>More to come soon...</p>
          </div>
        </div>
      </div>
    </main>
  );
}
