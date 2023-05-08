import { getMembers } from "@/lib/getMembers";
import { MemberInterface } from "@/types/members";

export default async function Members() {
  const members: MemberInterface[] = await getMembers();
  return (
    <div>
      <h1>All Members</h1>
      <ul>
        {members.map((member) => (
          <li key={member.slug}>
            <a href={member.path}>{member.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
