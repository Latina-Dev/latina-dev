import About from "@/components/Homepage/About/About";
import Hero from "@/components/Homepage/Hero/Hero";
import MemberPreview from "@/components/Homepage/MemberPreview/MemberPreview";
import { getMembers } from "@/lib/getMembers";
import { MemberInterface } from "@/types/members";
import styles from "./page.module.css";

export default async function Home() {
  const members: MemberInterface[] = await getMembers();

  return (
    <div className={styles.center}>
      <Hero />
      <hr className={styles.heroBorder} />
      <About />
      <MemberPreview members={members} />
      {/* Removing Maintainers for now since it feels a little redundant  but once we have more, it should be fine */}
      {/* <Maintainers /> */}
    </div>
  );
}
