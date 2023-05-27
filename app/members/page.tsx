import Footer from "@/components/Footer/Footer";
import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import Member from "@/components/MemberCard/Member";
import Navbar from "@/components/Navbar/Navbar";
import { getMembers } from "@/lib/getMembers";
import { MemberInterface } from "@/types/members";
import styles from "./memberspage.module.css";

export default async function MembersPage() {
  const members: MemberInterface[] = await getMembers();
  return (
    <section className={styles.memberspage}>
      <GitHubCorner />
      <Navbar />
      <div className={styles.container}>
        <div className={styles.center}>
          <h1 className="mt-20 text-5xl sm:text-6xl">All Members</h1>
          <div className="mt-20 grid grid-cols-1 gap-y-12 md:grid md:grid-cols-2 md-grid-rows md:gap-x-12 lg:grid lg:grid-cols-3 lg:grid-rows lg:gap-x-10">
            {members.map((member) => (
              <Member key={member.slug} member={member} />
            ))}
          </div>
          <Footer />
        </div>
      </div>
    </section>
  );
}
