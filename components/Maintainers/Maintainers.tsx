import styles from "./Maintainers.module.css";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";

export default function Maintainers() {
  return (
    <section className={styles.maintainers}>
      <h3>Maintainers</h3>
      <div className="mt-10 grid grid-rows-1 grid-cols-2">
        <div>
          <img src="/img/maintainers/frances.jpg" alt="Frances Coronel"></img>{" "}
          <h4 className="mt-3">Frances Coronel</h4>
          <small>Senior Software Enginner at JupiterOne</small>
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
          <img
            src="/img/maintainers/gabriellac.jpg"
            alt="Gabriella Corales"
          ></img>
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
  );
}
