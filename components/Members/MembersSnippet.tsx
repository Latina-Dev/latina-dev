import Member from "@/components/Members/Member/Member";
import { MemberInterface } from "@/types/members";
import styles from "./Members.module.css";

interface Props {
  members: MemberInterface[];
}

const Members = (props: Props) => {
  const { members } = props;

  // sort members by added date property
  const membersSorted = members.sort((a, b) => {
    const firstDate = new Date(a.added);
    const secondDate = new Date(b.added);
    if (firstDate < secondDate) return -1;
    return 1;
  });

  return (
    <section className={styles.avatars}>
      <h2>Members</h2>
      <div className="mt-10 grid grid-cols-1 gap-y-10 lg:grid lg:grid-cols-3 lg:grid-rows-2 lg:gap-x-10">
        {membersSorted.map((member) => (
          <Member key={member.slug} member={member} />
        ))}
      </div>
    </section>
  );
};

export default Members;
