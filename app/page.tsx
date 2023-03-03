import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import Logo from "@/components/Logo/Logo";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import { description, title } from "./head";
import styles from "./page.module.css";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faDiscord,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

export default function Home() {
  return (
    <main className={styles.main}>
      <GitHubCorner />
      <div className={styles.container}>
        <div className={styles.center}>
          <Navbar />
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
          <hr className={styles.heroborder} />
          
          <section className={styles.about} id="#about">
            <h2>About Us</h2>
            <strong>
              Una comunidad for her, by her, to connect, elevate, and empower
              the next generation of Latina software engineers
            </strong>
            <div className={styles.description}>
              <p>
                Less than 15% of engineers are women; 2% are Latina. We want
                that to change! {description}
              </p>
            </div>
            <Link
              href="https://discord.gg/vxasT67u"
              aria-label="Latina Dev Discord"
              target={"_blank"}
              className={styles.contributeLink}
            >
              Join us on Discord <FontAwesomeIcon icon={faDiscord} />
            </Link>
          </section>

          <section className={styles.maintainers}>
            <h3>Chief Maintainers</h3>
            <div className="mt-10 grid grid-rows-1 grid-cols-2">
              <div>
                <img src="/img/maintainers/frances.jpg"></img>{" "}
                <h4 className="mt-3">Frances Coronel</h4>
                <small>Senior Software Enginner at JupiterSpark</small>
                <div className={styles.maintainersociallinks}>
                  <Link
                    href="https://www.linkedin.com/in/francescoronel/"
                    aria-label="Frances Coronel LinkedIn"
                    target={"_blank"}
                  >
                    <FontAwesomeIcon icon={faLinkedin} />
                  </Link>
                  <Link
                    href="https://github.com/FrancesCoronel"
                    aria-label="Frances Coronel GitHub"
                    target={"_blank"}
                  >
                    <FontAwesomeIcon icon={faGithub} />
                  </Link>
                </div>
              </div>
              <div>
                <img src="/img/maintainers/gabriellac.jpg"></img>
                <h4 className="mt-3">Gabriella Corales</h4>
                <small>Educator turned Aspiring Front End Developer</small>
                <div className={styles.maintainersociallinks}>
                  <Link
                    href="https://www.linkedin.com/in/gabriella-corales/"
                    aria-label="Gabriella Corales LinkedIn"
                    target={"_blank"}
                  >
                    <FontAwesomeIcon icon={faLinkedin} />
                  </Link>
                  <Link
                    href="https://github.com/EllaCodes4"
                    aria-label="Gabriella Corales GitHub"
                    target={"_blank"}
                  >
                    <FontAwesomeIcon icon={faGithub} />
                  </Link>
                  <Link
                    href="https://twitter.com/EllaCodes"
                    aria-label="Gabriella Corales Twitter"
                    target={"_blank"}
                  >
                    <FontAwesomeIcon icon={faTwitter} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <footer className={styles.footer}>
            <Link
              href="https://github.com/FrancesCoronel/latina-dev"
              aria-label="Latina Dev GitHub"
              target={"_blank"}
            >
              <FontAwesomeIcon icon={faGithub} />
            </Link>
            <Link
              href="https://discord.gg/vxasT67u"
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
          </footer>
        </div>
      </div>
    </main>
  );
}
