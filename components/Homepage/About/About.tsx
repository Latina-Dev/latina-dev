import { faGithub, faSlack } from "@fortawesome/free-brands-svg-icons";

import ButtonLink from "@/components/ButtonLink/ButtonLink";

import styles from "./About.module.css";

export default function About() {
  return (
    <section className={`page-width ${styles.about}`} id="about" aria-labelledby="about-heading">
      <div>
        <p className="eyebrow">About us</p>
        <h2 id="about-heading" className={styles.heading}>
          A community for present &amp; future Latina software engineers.
        </h2>
      </div>
      <div>
        {/* TODO(Frances): add a linked source for these numbers, or reword them. They have no
            citation yet, and AI search tools are less likely to repeat unsourced statistics. */}
        <p className={styles.description}>
          Built to connect, elevate, and empower the next generation of tech leaders. Less than 15%
          of engineers are women. Only 2% are Latina. We&apos;re changing that. Latina Dev is an
          open-source directory and community where Latina engineers at the student, IC, and
          leadership levels can find visibility, opportunity, and each other.
        </p>
        <dl className={styles.stats}>
          <div>
            <dt>of engineers are women</dt>
            <dd>15%</dd>
          </div>
          <div>
            <dt>of engineers are Latina</dt>
            <dd>2%</dd>
          </div>
        </dl>
        <div className={styles.actions}>
          <ButtonLink
            text="Request an invite to our Slack community"
            url="/add-member"
            icon={faSlack}
          />
          <ButtonLink
            text="Contribute on GitHub"
            url="https://github.com/Latina-Dev/latina-dev"
            external
            icon={faGithub}
            variant="outline"
          />
        </div>
      </div>
    </section>
  );
}
