import type { Metadata } from "next";

import { faSlack } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandshake, faStar, faUsers } from "@fortawesome/free-solid-svg-icons";

import ButtonLink from "@/components/ButtonLink/ButtonLink";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "East Bay Conference",
  description:
    "Latina Dev is hosting a conference for Latina software engineers in the East Bay Area in October 2026. Join us, volunteer, or sponsor. Connect with the community on Slack.",
  openGraph: {
    title: "East Bay Conference for Latina Engineers | Latina Dev",
    description:
      "Join us in the East Bay for a day of connection, learning, and celebration of Latina engineers. Volunteer interest now open.",
    images: [{ url: "/img/featured-image.png", width: 1200, height: 630 }],
  },
};

export default function ConferencePage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.tag}>October 2026 · East Bay, CA</p>
        <h1 className={styles.title}>East Bay Conference</h1>
        <p className={styles.subtitle}>
          A day of community, learning, and celebration for Latina software engineers in the Bay
          Area.
        </p>
        <div className={styles.heroCta}>
          <ButtonLink
            text="Join our Slack to stay updated"
            url="mailto:hello@latina.dev"
            external={true}
            icon={faSlack}
          />
        </div>
      </section>

      <hr className={styles.divider} />

      {/* About */}
      <section className={styles.section}>
        <h2>About the Conference</h2>
        <p className={styles.body}>
          We&apos;re bringing the Latina Dev community together in the East Bay for our first
          in-person conference — a space designed by and for Latina engineers. Expect inspiring
          talks, hands-on workshops, career panels, and plenty of time to connect with engineers at
          all levels.
        </p>
        <p className={styles.body}>
          Details on venue, exact date, and registration are coming soon. Drop into our Slack
          community to be the first to know.
        </p>
      </section>

      {/* Volunteer */}
      <section className={styles.section}>
        <h2>Volunteer with Us</h2>
        <p className={styles.body}>
          This event is community-powered. We&apos;re looking for volunteers to help with logistics,
          speaker coordination, day-of support, social media, and more. Whether you have an hour or
          a whole weekend, we&apos;d love your help.
        </p>

        <div className={styles.roleGrid}>
          <div className={styles.role}>
            <FontAwesomeIcon icon={faUsers} className={styles.roleIcon} />
            <h3>Event Logistics</h3>
            <p>Help with setup, registration, wayfinding, and day-of coordination.</p>
          </div>
          <div className={styles.role}>
            <FontAwesomeIcon icon={faStar} className={styles.roleIcon} />
            <h3>Speaker Support</h3>
            <p>Coordinate with speakers, manage A/V, and moderate sessions.</p>
          </div>
          <div className={styles.role}>
            <FontAwesomeIcon icon={faHandshake} className={styles.roleIcon} />
            <h3>Community</h3>
            <p>Welcome attendees, foster connections, and keep the energy going.</p>
          </div>
        </div>

        <div className={styles.volunteerCta}>
          <p className={styles.body}>
            Ready to help? Join our Slack and introduce yourself in{" "}
            <strong>#conference-volunteers</strong>. We&apos;ll reach out with next steps.
          </p>
          <ButtonLink
            text="Request a Slack invite"
            url="mailto:hello@latina.dev"
            external={true}
            icon={faSlack}
          />
        </div>
      </section>

      {/* Stay in the loop */}
      <section className={styles.section}>
        <h2>Stay in the Loop</h2>
        <p className={styles.body}>
          All conference updates, volunteer opportunities, and speaker announcements will be shared
          in our Slack community first. Don&apos;t miss it — request an invite today.
        </p>
        <ButtonLink
          text="Request a Slack invite"
          url="mailto:hello@latina.dev"
          external={true}
          icon={faSlack}
        />
      </section>
    </div>
  );
}
