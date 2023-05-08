import { getMembers } from "@/app/members/getMembers";

export type MemberData = {
  title: string;
  date: string;
  slug: string;
  path: string;
};

const Members = async () => {
  const members: MemberData[] = await getMembers();
  return (
    <div>
      <h1>All Members</h1>
      <ul>
        {members.map((member) => (
          <li key={member.slug}>
            <a href={member.path}>{member.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Members;
