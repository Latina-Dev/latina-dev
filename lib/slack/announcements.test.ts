import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { announcedFiles, announcementMessage, summaryMessage } from "@/lib/slack/announcements";

describe("announcedFiles", () => {
  it("picks new members, questions and guides, in that order", () => {
    assert.deepEqual(
      announcedFiles([
        "data/guides/negotiating.md",
        "data/questions/how-do-i-ask-for-a-raise.md",
        "data/members/ana-lopez.md",
        "data/members/README.md",
        "data/owners/ana-lopez.txt",
        "public/img/members/ana-lopez.jpg",
      ]),
      [
        { kind: "member", slug: "ana-lopez" },
        { kind: "question", slug: "how-do-i-ask-for-a-raise" },
        { kind: "guide", slug: "negotiating" },
      ]
    );
  });
});

describe("announcementMessage", () => {
  it("welcomes a new member with a link, escaping her text", () => {
    const { text } = announcementMessage({
      kind: "member",
      slug: "ana-lopez",
      profile: { name: "Ana <López>", affiliation: "Engineer at A&B" },
    });
    assert.match(text, /latina\.dev\/members\/ana-lopez\|Ana &lt;López&gt;>/);
    assert.match(text, /Engineer at A&amp;B/);
  });

  it("counts answers on a question", () => {
    const one = announcementMessage({
      kind: "question",
      title: "Q",
      url: "https://latina.dev/questions/q",
      answers: 1,
    });
    assert.match(one.text, /\(1 answer\)/);
  });
});

describe("summaryMessage", () => {
  it("rolls a backlog into one message", () => {
    assert.match(
      summaryMessage({ question: 12, member: 1 }).text,
      /1 new member .*12 answered questions/
    );
  });
});
