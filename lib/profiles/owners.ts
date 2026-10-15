import { createHash } from "crypto";
import fs from "fs";

/**
 * Who may edit which profile. Each approved member has a file data/owners/<slug>.txt holding the
 * SHA-256 of their LinkedIn account id. Naming the file by profile means two pending claims on
 * the same profile touch the same path, so only one can ever merge, and the hash keeps the raw
 * id out of the repo.
 */
export const ownersPath = "data/owners";

/**
 * Hash a LinkedIn account id (the OpenID Connect `sub`) into an owner key
 * @param linkedinId the `sub` claim LinkedIn returns at sign-in
 */
export const ownerHash = (linkedinId: string) =>
  createHash("sha256").update(`linkedin:${linkedinId}`).digest("hex");

/** Owner file for a profile, e.g. data/owners/frances-coronel.txt */
export const ownerFile = (slug: string) => `${ownersPath}/${slug}.txt`;

/**
 * Find the profile a signed-in member owns
 * @param hash owner key from ownerHash
 * @returns the profile slug, or undefined if they haven't been approved for one yet
 */
export const readOwnedSlug = (hash: string) => {
  if (!/^[a-f0-9]{64}$/.test(hash)) return undefined;
  try {
    return fs
      .readdirSync(ownersPath)
      .filter((file) => file.endsWith(".txt"))
      .find((file) => fs.readFileSync(`${ownersPath}/${file}`, "utf8").trim() === hash)
      ?.replace(/\.txt$/, "");
  } catch {
    return undefined;
  }
};

/**
 * Branch that holds a member's pending profile change, one per member so a resubmission
 * replaces the earlier one instead of piling up pull requests
 * @param hash owner key from ownerHash
 */
export const ownerBranch = (hash: string) => `profile/${hash.slice(0, 12)}`;
