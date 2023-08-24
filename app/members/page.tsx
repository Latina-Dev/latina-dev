import MemberCard from "@/components/MemberCard/MemberCard";
import { getMembers } from "@/lib/getMembers";
import { MemberInterface } from "@/types/members";
import styles from "./page.module.css";

export default async function MembersPage() {
  const members: MemberInterface[] = await getMembers();
  const memberCount = members.length;
  return (
    <div className={styles.center}>
      <h1 className="mt-20 text-5xl sm:text-6xl">Members ({memberCount})</h1>
      <div className="mt-20 grid grid-cols-1 gap-y-12 md:grid md:grid-cols-2 md-grid-rows md:gap-x-12 lg:grid lg:grid-cols-3 lg:grid-rows lg:gap-x-10">
        {members.map((member) => (
          <MemberCard key={member.slug} member={member} />
        ))}
      </div>
    </div>
  );
}
