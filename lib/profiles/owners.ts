import { createHash } from "crypto";
import fs from "fs";

/**
 * Who may edit which profile. Each approved member has a file data/owners/<hash>.txt holding
 * their profile slug, where <hash> is the SHA-256 of their LinkedIn account id. One file per
 * member keeps concurrent sign-ups from conflicting, and the hash keeps the raw id out of the repo.
 */
export const ownersPath = "data/owners";

/**
 * Hash a LinkedIn account id (the OpenID Connect `sub`) into an owner key
 * @param linkedinId the `sub` claim LinkedIn returns at sign-in
 */
export const ownerHash = (linkedinId: string) =>
  createHash("sha256").update(`linkedin:${linkedinId}`).digest("hex");

/**
 * Find the profile a signed-in member owns
 * @param hash owner key from ownerHash
 * @returns the profile slug, or undefined if they haven't been approved for one yet
 */
export const readOwnedSlug = (hash: string) => {
  if (!/^[a-f0-9]{64}$/.test(hash)) return undefined;
  try {
    const slug = fs.readFileSync(`${ownersPath}/${hash}.txt`, "utf8").trim();
    return slug || undefined;
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
