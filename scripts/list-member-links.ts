import { readMemberFiles } from "@/lib/getMembers";

// Prints every member website and GitHub profile URL, one per line, for the weekly lychee
// link check. LinkedIn and Twitter are left out because they block automated checkers.
const urls = readMemberFiles().flatMap(({ data }) => [
  data.website,
  data.github && `https://github.com/${data.github}`,
]);

console.log(urls.filter(Boolean).join("\n"));
