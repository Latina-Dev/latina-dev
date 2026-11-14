import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseQuestionFile, plainText, questionJsonLd, renderMarkdown } from "@/lib/questions";
import {
  buildQuestion,
  isHidden,
  matchMember,
  questionSlug,
  questionTitle,
  serializeQuestion,
  SlackMessage,
  slackToMarkdown,
  SyncContext,
  tsToIso,
} from "@/lib/questionSync";

const context: SyncContext = {
  people: new Map([
    ["U1", { name: "Ana Pérez", slug: "ana-perez" }],
    ["U2", { name: "Luz Ortiz" }],
    ["U3", { name: "Frances Coronel", slug: "frances-coronel" }],
  ]),
  channels: new Map([["C9", "jobs"]]),
  moderators: new Set(["U3"]),
};

const question: SlackMessage = {
  ts: "1763000000.000100",
  user: "U1",
  text: "How did you negotiate your first senior offer? I have one from a startup.",
  reply_count: 2,
};
const answer = (ts: string, user: string, text: string, extra: Partial<SlackMessage> = {}) => ({
  ts,
  thread_ts: question.ts,
  user,
  text,
  ...extra,
});

describe("slackToMarkdown", () => {
  it("turns mentions and links into Markdown", () => {
    assert.equal(
      slackToMarkdown(
        "Ask <@U2> in <#C9|jobs>, see <https://levels.fyi|Levels> or <https://a.com?x=1&amp;y=2>",
        context
      ),
      "Ask @Luz Ortiz in #jobs, see [Levels](https://levels.fyi) or [https://a.com?x=1&y=2](https://a.com?x=1&y=2)"
    );
  });

  it("escapes any leftover angle brackets so no tag reaches the file", () => {
    assert.equal(
      slackToMarkdown("call <tel:123|me> or <slack://open> <script>", context),
      "call me or &lt;slack://open&gt; &lt;script&gt;"
    );
  });

  it("drops broadcasts and email links", () => {
    assert.equal(slackToMarkdown("<!here> write to <mailto:a@b.com|me>", context), "write to me");
  });

  it("keeps escaped HTML as text outside code and decodes it inside", () => {
    assert.equal(
      slackToMarkdown("Is &lt;div&gt; ok? ```const a = 1 &lt; 2```", context),
      "Is &lt;div&gt; ok?\n\n```\nconst a = 1 < 2\n```"
    );
  });

  it("converts bold, bullets and line breaks", () => {
    assert.equal(
      slackToMarkdown("*Tips*\n• one\n• two\nthanks", context),
      "**Tips**\n- one\n- two\n\nthanks"
    );
  });
});

describe("questionTitle", () => {
  it("uses the first question", () => {
    assert.equal(
      questionTitle("How did you negotiate? I have an offer."),
      "How did you negotiate?"
    );
  });

  it("drops a leading mention", () => {
    assert.equal(questionTitle("@Luz Ortiz any tips? thanks"), "@Luz Ortiz any tips?");
  });

  it("shortens a long first line", () => {
    const title = questionTitle(`${"word ".repeat(40)}end`);
    assert.ok(title.length <= 100 && title.endsWith("…"));
  });
});

describe("questionSlug", () => {
  it("makes a unique ASCII slug", () => {
    assert.equal(questionSlug("¿Cómo negocio mi oferta?", new Set()), "como-negocio-mi-oferta");
    assert.equal(questionSlug("Same", new Set(["same"])), "same-2");
  });

  it("cuts long slugs at a word", () => {
    const slug = questionSlug(
      "What should I ask a hiring manager before accepting a senior engineering offer",
      new Set()
    );
    assert.ok(slug.length <= 60 && !slug.endsWith("-"));
    assert.ok("what-should-i-ask-a-hiring-manager-before-accepting-a-senior".startsWith(slug));
  });
});

describe("buildQuestion", () => {
  it("waits for an answer from someone other than the asker", () => {
    assert.equal(buildQuestion(question, [question], context), undefined);
    assert.equal(
      buildQuestion(question, [question, answer("1763000100.000200", "U1", "bump")], context),
      undefined
    );
  });

  it("builds a valid file with answers in order", () => {
    const built = buildQuestion(
      question,
      [
        question,
        answer("1763000300.000300", "U3", "Always ask for more."),
        answer("1763000200.000200", "U2", "Ask what the range is first."),
        answer("1763000250.000250", "U2", "", { subtype: "channel_join" }),
      ],
      context
    )!;
    assert.equal(built.frontmatter.title, "How did you negotiate your first senior offer?");
    assert.equal(built.frontmatter.authorSlug, "ana-perez");
    assert.deepEqual(
      built.frontmatter.answers.map((a) => a.author),
      ["Luz Ortiz", "Frances Coronel"]
    );
    const file = parseQuestionFile(
      "negotiate.md",
      serializeQuestion(built.frontmatter, built.body)
    );
    assert.equal(file.answers.length, 2);
    assert.equal(file.updated, tsToIso("1763000300.000300"));
    const jsonLd = questionJsonLd(file);
    assert.equal(jsonLd.mainEntity.answerCount, 2);
    assert.equal(jsonLd.mainEntity.author.url, "https://latina.dev/members/ana-perez");
  });

  it("leaves out what an organizer or the author hid with 🚫", () => {
    const hide = (users: string[]) => ({ reactions: [{ name: "no_entry_sign", users }] });
    assert.equal(isHidden({ ...question, ...hide(["U2"]) }, context.moderators), false);
    // Slack left someone out of the list, who may be an organizer
    assert.equal(
      isHidden(
        { ...question, reactions: [{ name: "no_entry_sign", users: ["U2"], count: 2 }] },
        context.moderators
      ),
      true
    );
    assert.equal(
      buildQuestion(
        { ...question, ...hide(["U3"]) },
        [answer("1763000200.000200", "U2", "Yes")],
        context
      ),
      undefined
    );
    const built = buildQuestion(
      question,
      [
        answer("1763000200.000200", "U2", "Yes"),
        answer("1763000300.000300", "U3", "Spam", hide(["U3"])),
        answer("1763000400.000400", "U2", "Mine", hide(["U2"])),
      ],
      context
    )!;
    assert.deepEqual(
      built.frontmatter.answers.map((a) => a.text),
      ["Yes"]
    );
  });
});

describe("matchMember", () => {
  const members = [
    { name: "Ana Pérez", slug: "ana-perez" },
    { name: "Luz Ortiz", slug: "luz-ortiz" },
    { name: "Luz Ortiz", slug: "luz-ortiz-2" },
  ];

  it("matches one member by full name, ignoring accents and case", () => {
    assert.equal(matchMember("ana perez", members), "ana-perez");
  });

  it("skips first names alone and names two members share", () => {
    assert.equal(matchMember("Ana", members), undefined);
    assert.equal(matchMember("Luz Ortiz", members), undefined);
  });
});

describe("renderMarkdown", () => {
  it("strips HTML from member text", async () => {
    const html = await renderMarkdown('Hi <script>alert(1)</script><img src=x onerror="x">');
    assert.ok(!html.includes("<script") && !html.includes("onerror"));
  });
});

describe("plainText", () => {
  it("drops emphasis but keeps underscores in links and identifiers", () => {
    assert.equal(
      plainText("_Try_ [my repo](https://a.com/my_repo) and `get_user`"),
      "Try my repo (https://a.com/my_repo) and get_user"
    );
  });
});
