import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isNeedId, isStageId, matchSupport, SupportData } from "@/lib/findSupport";

const resource = (name: string, types: string[], stages: string[]) => ({
  name,
  url: `https://${name}.example`,
  description: name,
  types,
  stages,
  page: `/resources/x#${name}`,
});

const data: SupportData = {
  resources: [
    resource("board", ["Job board"], ["Workplace"]),
    resource("college-board", ["Job board"], ["College"]),
    resource("club", ["Community"], ["Workplace", "Leadership"]),
    resource("summit", ["Conference"], ["Workplace"]),
  ],
  guides: [
    {
      slug: "workplace-advice",
      title: "Advice",
      path: "/guides/workplace-advice",
      description: "",
    },
    { slug: "k-12-students", title: "K-12", path: "/guides/k-12-students", description: "" },
  ],
  mentors: [
    { name: "Bea", path: "/members/bea", level: "Individual Contributor" },
    { name: "Ana", path: "/members/ana", level: "Leader" },
    { name: "Cami", path: "/members/cami", level: "Leader" },
  ],
  questions: [1, 2, 3, 4].map((n) => ({ title: `Q${n}`, path: `/questions/q${n}` })),
};

describe("matchSupport", () => {
  it("matches the stage and the need's types", () => {
    const result = matchSupport(data, "working", "job");
    assert.deepEqual(
      result.resources.map((r) => r.name),
      ["board"]
    );
    assert.equal(result.broadened, false);
    assert.deepEqual(
      result.guides.map((g) => g.slug),
      ["workplace-advice"]
    );
    assert.equal(result.mentors.length, 0);
    assert.equal(result.questions.length, 3);
  });

  it("falls back to any stage when nothing fits exactly", () => {
    const result = matchSupport(data, "founding", "events");
    assert.deepEqual(
      result.resources.map((r) => r.name),
      ["summit"]
    );
    assert.equal(result.broadened, true);
  });

  it("lists mentors, leaders first for people leading a team", () => {
    assert.deepEqual(
      matchSupport(data, "leading", "mentor").mentors.map((m) => m.name),
      ["Ana", "Cami", "Bea"]
    );
    assert.deepEqual(
      matchSupport(data, "college", "mentor").mentors.map((m) => m.name),
      ["Ana", "Bea", "Cami"]
    );
  });

  it("checks choices read from a shared link", () => {
    assert.ok(isStageId("college") && isNeedId("job"));
    assert.ok(!isStageId("nope") && !isNeedId(null));
  });
});
