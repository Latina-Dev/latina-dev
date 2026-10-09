import Link from "next/link";

import MemberCard from "@/components/MemberCard/MemberCard";

import { MemberInterface } from "@/types/members";

import styles from "./MembersSnippet.module.css";

/** The most recently added members, newest first */
const newestMembers = (members: MemberInterface[], count: number) =>
  [...members].sort((a, b) => b.added.localeCompare(a.added)).slice(0, count);

interface Props {
  members: MemberInterface[];
}

const MemberPreview = (props: Props) => {
  const { members } = props;

  return (
    <section className={`page-width ${styles.preview}`} aria-labelledby="recent-heading">
      <div className={styles.header}>
        <h2 id="recent-heading">Recently added</h2>
        <Link href="/members" className={styles.all}>
          See all {members.length} engineers <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ul className={styles.grid}>
        {newestMembers(members, 4).map((member) => (
          <li key={member.slug}>
            <MemberCard member={member} />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default MemberPreview;
