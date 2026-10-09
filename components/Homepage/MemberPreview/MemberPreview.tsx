import { faPeopleGroup } from "@fortawesome/free-solid-svg-icons";

import ButtonLink from "@/components/ButtonLink/ButtonLink";
import MemberCard from "@/components/MemberCard/MemberCard";

import { MemberInterface } from "@/types/members";

import styles from "./MembersSnippet.module.css";

/**
 * Pick random members without mutating the original array
 * @param members
 * @param count
 * @returns random members
 */
const pickRandomMembers = (members: MemberInterface[], count: number) =>
  [...members].sort(() => Math.random() - 0.5).slice(0, count);

interface Props {
  members: MemberInterface[];
}

const MemberPreview = (props: Props) => {
  const { members } = props;

  // 6 random members picked from original members array
  const membersRandom = pickRandomMembers(members, 6);

  return (
    <>
      <section className={styles.avatars}>
        <h2>Member Preview</h2>
        <div className="mt-10 grid grid-cols-1 gap-y-12 md:grid md:grid-cols-2 md:grid-rows-3 md:gap-x-10 lg:grid lg:grid-cols-3 lg:grid-rows-2 lg:gap-x-10">
          {membersRandom.map((member) => (
            <MemberCard key={member.slug} member={member} />
          ))}
        </div>
      </section>
      <section className={styles.cta}>
        <ButtonLink text="View all our Members " url="/members" icon={faPeopleGroup} />
      </section>
    </>
  );
};

export default MemberPreview;
