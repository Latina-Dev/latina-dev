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
          <Link href="/members/" className="pl-4 sm:pl-10 underline">
            All Members
          </Link>
        </li>
        <li>
          <Link
            href="https://forms.fillout.com/t/xARDm8SG6mus"
            target={"_blank"}
            className="pl-4 sm:pl-10 underline"
          >
            Add your profile
          </Link>
        </li>
        <li>
          <Link
            href="https://github.com/FrancesCoronel/latina-dev"
            target={"_blank"}
            className="pl-4 sm:pl-10 underline"
          >
            Contribute
          </Link>
        </li>
      </ul>
    </nav>
  );
}
