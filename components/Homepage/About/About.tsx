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
        <p className={styles.description}>
          Built to connect, elevate, and empower the next generation of tech leaders. Only about 1
          in 5 software developers in the US are women, and Black, Latina, and Native American women
          together hold about 4% of tech jobs. We&apos;re changing that. Latina Dev is an
          open-source directory and community where Latina engineers at the student, IC, and
          leadership levels can find visibility, opportunity, and each other.
        </p>
        <dl className={styles.stats}>
          <div>
            <dt>of US software developers are women</dt>
            <dd>20%</dd>
          </div>
          <div>
            <dt>of tech jobs are held by Black, Latina, and Native American women</dt>
            <dd>4%</dd>
          </div>
        </dl>
        <p className={styles.sources}>
          Sources:{" "}
          <a href="https://www.bls.gov/cps/cpsaat11.htm">
            U.S. Bureau of Labor Statistics, Current Population Survey, 2025
          </a>
          ;{" "}
          <a href="https://www.mckinsey.com/featured-insights/week-in-charts/a-dearth-of-blna-women-in-tech">
            McKinsey &amp; LeanIn.Org, Women in the Workplace, 2022
          </a>
          .
        </p>
        <div className={styles.actions}>
          <ButtonLink
            text="Request an invite to our Slack community"
            url="/add-member"
            icon={faSlack}
          />
          <ButtonLink
            text="Star us on GitHub"
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
