import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import Member from "@/components/Members/Member/Member";
import Navbar from "@/components/Navbar/Navbar";
import { getMembers } from "@/lib/getMembers";
import { MemberInterface } from "@/types/members";
import Link from "next/link";
import styles from "./page.module.css";

export default async function MembersPage() {
  const members: MemberInterface[] = await getMembers();
  return (
    <section className={styles.memberspage}>
      <GitHubCorner />
        <Navbar />
        <h1 className="text-5xl">Members</h1>
        <div className="mt-10 grid grid-cols-1 gap-y-10 lg:grid lg:grid-cols-2 lg:grid-rows lg:gap-x-10">
          {members.map((member) => (
            <div key={member.slug}>
              <Link href={member.path}>
                <Member member={member} />
              </Link>
            </div>
          ))}
        </div>
    
    </section>
  );
}
