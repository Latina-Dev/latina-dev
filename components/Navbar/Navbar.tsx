import Link from "next/link";

import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar} aria-label="Main navigation">
      <ul>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/members/">Members</Link>
        </li>
        <li>
          <Link href="/conference">Conference</Link>
        </li>
        <li>
          <Link href="/add-member">Add your profile</Link>
        </li>
        <li>
          <Link href="https://docs.latina.dev" target="_blank" rel="noopener noreferrer">
            Contribute
          </Link>
        </li>
      </ul>
    </nav>
  );
}
