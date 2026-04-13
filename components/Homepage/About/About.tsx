import { faSlack } from "@fortawesome/free-brands-svg-icons";

import ButtonLink from "@/components/ButtonLink/ButtonLink";

import styles from "./About.module.css";

export default function About() {
  return (
    <section className={styles.about} id="about">
      <h2>About Us</h2>
      <div className="mt-10">
        <strong>
          A community for present &amp; future Latina software engineers — built to connect,
          elevate, and empower the next generation of tech leaders.
        </strong>
      </div>
      <div className={styles.description}>
        <p>
          Less than 15% of engineers are women. Only 2% are Latina. We&apos;re changing that. Latina
          Dev is an open-source directory and community where Latina engineers at the student, IC,
          and leadership levels can find visibility, opportunity, and each other.
        </p>
      </div>
      <ButtonLink
        text="Request an invite to our Slack community"
        url="/add-member"
        icon={faSlack}
      />
    </section>
  );
}
