import Image from "next/image";
import Link from "next/link";

import styles from "./Footer.module.css";

const links = [
  { href: "https://github.com/Latina-Dev/latina-dev", label: "GitHub", external: true },
  { href: "/add-member", label: "Slack" },
  { href: "https://www.linkedin.com/company/latina-dev/", label: "LinkedIn", external: true },
  { href: "https://docs.latina.dev", label: "Contribute", external: true },
  {
    href: "https://6472ce8643c60096810af8c0-xxywyuqilq.chromatic.com/",
    label: "Storybook",
    external: true,
  },
  {
    href: "https://github.com/Latina-Dev/latina-dev/blob/main/.github/CODE_OF_CONDUCT.md",
    label: "Code of conduct",
    external: true,
  },
];

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={`page-width ${styles.inner}`}>
        <div className={styles.tagline}>
          <Image src="/img/logos/owl-mark.svg" alt="" width={12} height={24} />
          <span>
            Open source. Contributions welcome.{" "}
            <a
              href="https://github.com/Latina-Dev/latina-dev"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.star}>
              Star us on GitHub
            </a>{" "}
            to help us qualify for open source programs.
          </span>
        </div>
        <nav aria-label="Footer" className={styles.links}>
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="https://vercel.com?utm_source=latina-dev&utm_campaign=oss"
          aria-label="Powered by Vercel"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.vercel}>
          <Image src="/img/logos/vercel.svg" alt="Powered by Vercel" width="159" height="33" />
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
