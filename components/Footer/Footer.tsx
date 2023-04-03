import styles from "./Footer.module.css";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faDiscord,
} from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer>
      <div className={styles.footer}>
        <Link
          href="https://github.com/FrancesCoronel/latina-dev"
          aria-label="Latina Dev GitHub"
          target={"_blank"}
        >
          <FontAwesomeIcon icon={faGithub} />
        </Link>
        <Link
          href="https://discord.com/invite/xzHDhxsQAQ"
          aria-label="Latina Dev Discord"
          target={"_blank"}
        >
          <FontAwesomeIcon icon={faDiscord} width={25} />
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
}
