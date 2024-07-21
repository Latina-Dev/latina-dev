import Image from "next/image";
import Link from "next/link";

import {
  faGithub,
  faLinkedin,
  faSlack
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer>
      <div className={styles.footer}>
        <Link
          href="https://github.com/Latina-Dev/latina-dev"
          aria-label="Latina Dev GitHub"
          target={"_blank"}
        >
          <FontAwesomeIcon icon={faGithub} />
        </Link>
        <Link
          href="https://latinadev.slack.com"
          aria-label="Latina Dev Slack"
          target={"_blank"}
        >
          <FontAwesomeIcon icon={faSlack} width={25} />
        </Link>
        <Link
          href="https://www.linkedin.com/company/latina-dev/"
          aria-label="Latina Dev LinkedIn"
          target={"_blank"}
        >
          <FontAwesomeIcon icon={faLinkedin} />
        </Link>
      </div>
      <div className={styles.vercel}>
        <Link
          href="https://vercel.com?utm_source=latina-dev&utm_campaign=oss"
          aria-label="Vercel"
          target={"_blank"}
        >
          <Image
            src="/img/logos/vercel.svg"
            alt="Vercel"
            width="212"
            height="44"
          ></Image>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
