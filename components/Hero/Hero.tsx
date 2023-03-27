import styles from "./Hero.module.css";
import Link from "next/link";
import Logo from "../Logo/Logo";
import { description, title } from "app/head";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export default function Hero() {
  return (
    <section className={styles.home} id="home">
      <div className={styles.logoContainer}>
        <Logo className={styles.logo} />
      </div>
      <h1>{title}</h1>
      <div className={styles.description}>
        <p>{description}</p>
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
