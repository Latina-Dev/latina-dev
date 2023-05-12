import About from "@/components/About/About";
import Footer from "@/components/Footer/Footer";
import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import Hero from "@/components/Hero/Hero";
import MembersSnippet from "@/components/Members/MembersSnippet";
import { getMembers } from "@/lib/getMembers";
import { MemberInterface } from "@/types/members";
import styles from "./page.module.css";

export default async function Home() {
  const members: MemberInterface[] = await getMembers();

  return (
    <main className={styles.main}>
      <GitHubCorner />
      <div className={styles.container}>
        <div className={styles.center}>
          <Hero />
          <hr className={styles.heroborder} />
          <About />
          <MembersSnippet members={members} />
          {/* Removing Maintainers for now since it feels a little redundant  but once we have more, it should be fine */}
          {/* <Maintainers /> */}
          <Footer />
        </div>
      </div>
    </main>
  );
}
