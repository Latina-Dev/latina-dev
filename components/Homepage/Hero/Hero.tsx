import { faGithub } from "@fortawesome/free-brands-svg-icons";

import ButtonLink from "@/components/ButtonLink/ButtonLink";

import Logo from "../../Logo/Logo";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.home} id="home">
      <div className={styles.logoContainer}>
        <Logo className={styles.logo} />
      </div>
      <h1>Latina Dev</h1>
      <div className={styles.description}>
        <p>
          An open-source directory of Latina software engineers at the student, IC, and leadership
          levels. Our goal is to increase visibility and access to valuable opportunities.
        </p>
      </div>
      <ButtonLink
        text="Contribute on GitHub"
        url="https://github.com/Latina-Dev/latina-dev"
        external={true}
        icon={faGithub}
      />
    </section>
  );
}
