import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { metadata } from "app/layout";
import Link from "next/link";
import Logo from "../../Logo/Logo";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.home} id="home">
      <div className={styles.logoContainer}>
        <Logo className={styles.logo} />
      </div>
      <h1>{metadata.title.default}</h1>
      <div className={styles.description}>
        <p>{metadata.description}</p>
      </div>
      <Link
        href="https://github.com/FrancesCoronel/latina-dev"
        aria-label="Latina Dev"
        target={"_blank"}
        className={styles.contributeLink}
      >
        Contribute on GitHub <FontAwesomeIcon icon={faGithub} />
      </Link>
    </section>
  );
}
