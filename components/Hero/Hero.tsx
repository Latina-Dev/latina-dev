import styles from "./Hero.module.css";
import Link from "next/link";
import Logo from "../Logo/Logo";
import { description, title } from "app/head";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

export default function Hero() {
  return (
    <section className={styles.home} id="home">
      <div className={styles.logoContainer}>
        <Logo />
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
