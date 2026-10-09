import { getMembers } from "@/lib/getMembers";

import { MemberInterface } from "@/types/members";

// Build this feed once at build time, like the member pages
export const dynamic = "force-static";

const siteUrl = "https://latina.dev";

type PublicMember = Omit<MemberInterface, "noindex"> & { url: string };

/**
 * Public, machine-readable list of members for agents and integrations.
 * Members with `noindex: true` are left out.
 */
export async function GET() {
  const members = await getMembers();

  const publicMembers: PublicMember[] = members
    .filter((member) => !member.noindex)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map(({ noindex: _noindex, ...member }) => ({
      ...member,
      url: `${siteUrl}${member.path}`,
    }));

  return Response.json({
    site: siteUrl,
    count: publicMembers.length,
    members: publicMembers,
  });
}
