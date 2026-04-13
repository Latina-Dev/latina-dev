import Image from "next/image";
import Link from "next/link";

import { faGithub, faLinkedin, faSlack } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./Footer.module.css";

function StorybookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 52 64"
      fill="currentColor"
      aria-hidden="true">
      <path
        fillRule="nonzero"
        d="M51.273 3.923a2.1 2.1 0 0 1 .006.194v55.766C51.279 61.604 49.869 63 48.13 63a2.12 2.12 0 0 1-.142-.003L5.949 61.128C4.311 61.055 3.004 59.752 2.943 58.131L1.002 6.955C.938 5.265 2.248 3.832 3.953 3.727L38.427 1.594l-.3 7.027a.32.32 0 0 0 .052.175l.043.068c.157.205.452.245.658.09l2.758-2.07 2.329 1.816a.32.32 0 0 0 .312.012c.26-.09.463-.305.454-.562L44.467 1.22l3.466-.214c1.736-.107 3.232 1.199 3.34 2.917ZM27.089 11.55c-8.199 0-12.793 4.407-12.793 11.018 0 11.514 15.7 11.735 15.7 18.015 0 1.763-.872 2.81-2.791 2.81-2.5 0-3.489-1.264-3.372-5.561 0-.932-9.536-1.223-9.827 0-.74 10.413 5.815 13.417 13.316 13.417 7.268 0 12.967-3.834 12.967-10.776 0-12.34-15.932-12.01-15.932-18.125 0-2.479 1.861-2.81 2.966-2.81 1.163 0 3.256.203 3.082 4.831 0 1.213 8.254.631 9.362-.22 0-8.259-4.477-12.599-12.678-12.599Z"
      />
    </svg>
  );
}

const Footer = () => {
  return (
    <footer>
      <div className={styles.footer}>
        <Link
          href="https://github.com/Latina-Dev/latina-dev"
          aria-label="Latina Dev GitHub"
          target={"_blank"}>
          <FontAwesomeIcon icon={faGithub} />
        </Link>
        <Link href="/add-member" aria-label="Latina Dev Slack">
          <FontAwesomeIcon icon={faSlack} width={25} />
        </Link>
        <Link
          href="https://www.linkedin.com/company/latina-dev/"
          aria-label="Latina Dev LinkedIn"
          target={"_blank"}>
          <FontAwesomeIcon icon={faLinkedin} />
        </Link>
        <Link
          href="https://6472ce8643c60096810af8c0-xxywyuqilq.chromatic.com/"
          aria-label="Latina Dev Storybook"
          target={"_blank"}>
          <StorybookIcon />
        </Link>
      </div>
      <div className={styles.vercel}>
        <Link
          href="https://vercel.com?utm_source=latina-dev&utm_campaign=oss"
          aria-label="Vercel"
          target={"_blank"}>
          <Image src="/img/logos/vercel.svg" alt="Vercel" width="212" height="44"></Image>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
