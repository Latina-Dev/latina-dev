import { getMembers } from "@/lib/getMembers";

import { MemberInterface } from "@/types/members";

// Build this feed once at build time, like the member pages
export const dynamic = "force-static";

const siteUrl = "https://latina.dev";

type PublicMember = MemberInterface & { url: string };

/**
 * Public, machine-readable list of every member for agents and integrations.
 */
export async function GET() {
  const members = await getMembers();

  const publicMembers: PublicMember[] = members
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((member) => ({
      ...member,
      url: `${siteUrl}${member.path}`,
    }));

  return Response.json({
    site: siteUrl,
    count: publicMembers.length,
    members: publicMembers,
  });
}
