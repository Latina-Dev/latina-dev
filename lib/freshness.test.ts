import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkInMessage, isDueForCheckIn, setUpdatedDate } from "@/lib/freshness";

const day = 24 * 60 * 60 * 1000;
const last = new Date("2025-11-10T00:00:00Z");
const after = (days: number) => new Date(last.getTime() + days * day);

describe("isDueForCheckIn", () => {
  it("waits a year", () => {
    assert.equal(isDueForCheckIn(last, after(364)), false);
    assert.equal(isDueForCheckIn(last, after(365)), true);
  });

  it("asks in one weekly run, then not again until the next year", () => {
    const weeklyRuns = Array.from({ length: 60 }, (_, week) => after(360 + week * 7));
    const asked = weeklyRuns.filter((run) => isDueForCheckIn(last, run));
    assert.equal(asked.length, 2); // year one and year two
    assert.ok(asked[1].getTime() - asked[0].getTime() >= 358 * day);
  });
});

describe("setUpdatedDate", () => {
  const file = `---\nname: Alda Pontes\nadded: "2023-05-31"\nlevel: "Leader"\nlinkedin: "aldapontes"\n---\n\nBio here.\n`;

  it("adds the date after added, leaving everything else alone", () => {
    assert.equal(
      setUpdatedDate(file, "2026-11-14"),
      file.replace('added: "2023-05-31"\n', 'added: "2023-05-31"\nupdated: "2026-11-14"\n')
    );
  });

  it("replaces an earlier date", () => {
    const once = setUpdatedDate(file, "2025-01-01");
    assert.equal(setUpdatedDate(once, "2026-11-14"), setUpdatedDate(file, "2026-11-14"));
  });

  it("never touches the bio", () => {
    const tricky = file.replace("Bio here.", 'updated: "1999-01-01" is in my bio');
    assert.match(setUpdatedDate(tricky, "2026-11-14"), /updated: "1999-01-01" is in my bio/);
  });

  it("rejects a bad date", () => {
    assert.throws(() => setUpdatedDate(file, "soon"));
  });
});

describe("checkInMessage", () => {
  it("shows the profile and both buttons, escaping profile text", () => {
    const message = checkInMessage("alda-pontes", {
      name: "Alda Pontes",
      added: "2023-05-31",
      level: "Leader",
      linkedin: "aldapontes",
      affiliation: "VP <Eng> at A&B",
    });
    const json = JSON.stringify(message);
    assert.match(json, /VP &lt;Eng&gt; at A&amp;B/);
    assert.match(json, /confirm_profile_current/);
    assert.match(json, /open_profile_editor/);
  });
});
