import { MemberInterface } from "@/types/members";

/** Small stable string hash, so related picks vary by member but not between builds */
const hash = (value: string) => {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return h;
};

/**
 * Pick other members to link from a profile page: same level first, preferring members who
 * share a country of heritage. Members with `noindex: true` are never suggested.
 * @param member the member whose profile is being rendered
 * @param members every member
 * @param count how many to return
 * @returns up to `count` related members
 */
export const getRelatedMembers = (
  member: MemberInterface,
  members: MemberInterface[],
  count = 3
): MemberInterface[] => {
  const countries = new Set(member.countries ?? []);
  const sharedCountries = (other: MemberInterface) =>
    (other.countries ?? []).filter((country) => countries.has(country)).length;

  return members
    .filter((other) => other.slug !== member.slug && !other.noindex && other.level === member.level)
    .map((other) => ({
      other,
      shared: sharedCountries(other),
      order: hash(`${member.slug}:${other.slug}`),
    }))
    .sort((a, b) => b.shared - a.shared || a.order - b.order)
    .slice(0, count)
    .map(({ other }) => other);
};
