import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <ul>
        <li>
          <Link href="/">
            Home
          </Link>
        </li>
        <li>
          <Link href="/members/" className="pl-4 sm:pl-10">
            Members
          </Link>
        </li>
        <li>
            <Link href="/about/" className="pl-4 sm:pl-10">
                About
            </Link>
        </li>
        <li>
          <Link
            href="https://forms.fillout.com/t/xARDm8SG6mus"
            target={"_blank"}
            className="pl-4 sm:pl-10 inline-block"
          >
            Add your profile
          </Link>
        </li>
        <li>
          <Link
            href="https://github.com/FrancesCoronel/latina-dev"
            target={"_blank"}
            className="pl-4 sm:pl-10"
          >
            Contribute
          </Link>
        </li>
      </ul>
    </nav>
  );
}
