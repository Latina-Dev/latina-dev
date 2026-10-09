import Image from "next/image";
import Link from "next/link";

import MobileMenu from "./MobileMenu";
import styles from "./Navbar.module.css";

const links = [
  { href: "/members", label: "Directory" },
  { href: "/conference", label: "Conference" },
  { href: "/#about", label: "About" },
];

export default function Navbar() {
  return (
    <header className={styles.masthead}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <div className={`page-width ${styles.bar}`}>
        <Link href="/" className={styles.brand}>
          <Image src="/img/logos/owl-mark-white.svg" alt="" width={14} height={28} />
          <span>Latina Dev</span>
        </Link>
        <nav className={styles.desktop} aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <Link href="/add-member" className={styles.cta}>
            Add your profile
          </Link>
        </nav>
        {/* Works without JavaScript: <details> opens and closes the menu on phones */}
        <MobileMenu className={styles.mobile}>
          <summary aria-label="Menu">
            <span className={styles.burger} aria-hidden="true" />
          </summary>
          <nav aria-label="Main navigation" className={styles.sheet}>
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <Link href="/add-member" className={styles.cta}>
              Add your profile
            </Link>
          </nav>
        </MobileMenu>
      </div>
    </header>
  );
}
