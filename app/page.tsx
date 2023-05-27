import Footer from "@/components/Footer/Footer";
import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import About from "@/components/Homepage/About/About";
import Hero from "@/components/Homepage/Hero/Hero";
import MemberPreview from "@/components/Homepage/MemberPreview/MemberPreview";
import Navbar from "@/components/Navbar/Navbar";
import { getMembers } from "@/lib/getMembers";
import { MemberInterface } from "@/types/members";
import styles from "./page.module.css";

export default async function Home() {
  const members: MemberInterface[] = await getMembers();

  return (
    <main className={styles.main}>
      <GitHubCorner />
      <Navbar />
      <div className={styles.container}>
        <div className={styles.center}>
          <Hero />
          <hr className={styles.heroborder} />
          <About />
          <MemberPreview members={members} />
          {/* Removing Maintainers for now since it feels a little redundant  but once we have more, it should be fine */}
          {/* <Maintainers /> */}
          <Footer />
        </div>
      </div>
    </main>
  );
}
