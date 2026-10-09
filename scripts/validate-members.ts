import { readMemberFiles } from "@/lib/getMembers";

// Validates data/members/*.md frontmatter; run with `npm run validate:members`
try {
  const members = readMemberFiles();
  console.log(`✓ ${members.length} member profiles are valid`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
