import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import styles from "./members.module.css";
import Members from "@/components/Members/Members";

export default function MembersPage() {
 return (
    <section className={styles.members}>
      <GitHubCorner />
      <div className={styles.container}>
        <div className={styles.center}>
          <h1 className={styles.title}>Members</h1>
          <Members />
        </div>
      </div>
    </section>
 );
}

