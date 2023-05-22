import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <ul>
        <li>
          <Link href="/" className="underline">
            Home
          </Link>
        </li>
        <li>
          <Link
            href="/members/"
            className="pl-4 pr-4 sm:pl-10 sm:pr-10 underline"
          >
            All Members
          </Link>
        </li>
        <li>
          <Link
            href="https://github.com/FrancesCoronel/latina-dev"
            aria-label="Latina Dev"
            target={"_blank"}
            className="underline"
          >
            Contribute
          </Link>
        </li>
      </ul>
    </nav>
  );
}
