import Link from "next/link";

import styles from "./Doors.module.css";

interface Props {
  memberCount: number;
  resourceCount: number;
  ergCount: number;
}

/** The three ways into the site: people, resources and ERGs */
export default function Doors({ memberCount, resourceCount, ergCount }: Props) {
  const doors = [
    {
      href: "/members",
      eyebrow: `${memberCount} engineers`,
      title: "Find Latina engineers",
      text: "Students, individual contributors and leaders, with what each is open to.",
    },
    {
      href: "/resources",
      eyebrow: `${resourceCount} resources`,
      title: "Find your next step",
      text: "Communities, programs, scholarships, job boards and conferences, by career stage.",
    },
    {
      href: "/ergs",
      eyebrow: `${ergCount} companies`,
      title: "Find or start an ERG",
      text: "Companies with a group for Latina and Latino employees, and a guide to starting one.",
    },
  ];

  return (
    <section className={`page-width ${styles.doors}`} aria-labelledby="doors-heading">
      <h2 id="doors-heading" className={styles.heading}>
        Where to start
      </h2>
      <ul>
        {doors.map((door) => (
          <li key={door.href}>
            <Link href={door.href}>
              <span className="eyebrow">{door.eyebrow}</span>
              <strong>{door.title}</strong>
              <span className={styles.text}>{door.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
