import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <ul>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/members/">Members</Link>
        </li>
        <li>
          <Link
            href="https://github.com/FrancesCoronel/latina-dev"
            aria-label="Latina Dev"
            target={"_blank"}
          >
            Contribute
          </Link>
        </li>
      </ul>
    </nav>
  );
}
