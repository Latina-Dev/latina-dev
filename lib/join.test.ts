import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { joinLabel, joinPath } from "@/lib/join";

/** Every .tsx file under the folders that render pages */
function pageFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return pageFiles(full);
    return entry.name.endsWith(".tsx") && !entry.name.includes(".stories.") ? [full] : [];
  });
}

const files = ["app", "components"].flatMap((dir) => pageFiles(path.join(process.cwd(), dir)));

describe("join call to action", () => {
  it("sends people to the add-profile page", () => {
    assert.equal(joinPath, "/add-member");
    assert.equal(joinLabel, "Add your profile");
  });

  it("uses JoinButton for every join button, so they all look and read the same", () => {
    const offenders = files.filter(
      (file) =>
        !file.endsWith(path.join("JoinButton", "JoinButton.tsx")) &&
        /<ButtonLink[^>]*?url=(?:"\/add-member"|\{joinPath\})/.test(readFileSync(file, "utf8"))
    );
    assert.deepEqual(offenders, [], "Use <JoinButton /> instead of a ButtonLink to /add-member");
  });

  it("labels every text link to the add-profile page the same way", () => {
    const offenders = files.flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(/<Link href="\/add-member"[^>]*>([^<]*)<\/Link>/g)]
        .map((match) => match[1].trim())
        .filter((label) => label.toLowerCase() !== joinLabel.toLowerCase())
        .map((label) => `${path.relative(process.cwd(), file)}: "${label}"`)
    );
    assert.deepEqual(offenders, []);
  });
});
