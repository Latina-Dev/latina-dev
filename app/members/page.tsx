import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import styles from "./members.module.css";
import Members from "@/components/Members/Members";
import getAllUsers from "@/lib/getAllUsers";
import Link from "next/link";

export default async function MembersPage() {
  const usersData: Promise<User[]> = getAllUsers();
  const users = await usersData;
  console.log("Hello");
  const content = (
    <section className={styles.members}>
      <GitHubCorner />
      <div className={styles.container}>
        <div className={styles.center}>
          <h1 className={styles.title}>Members</h1>
          <Members />
          {users.map((user) => {
            return (
              <>
                <p key={user.id}>
                  <Link href={`/users/${user.id}`}>{user.name}</Link>
                </p>
              </>
            );
          })}
        </div>
      </div>
    </section>
  );
  return content;
}
