import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  resourceCount,
  resourceFaqs,
  resourceGroups,
  resourcesJsonLd,
  resourceSlug,
} from "@/lib/resources";
import { validateResourceFrontmatter } from "@/lib/resourceSchema";
import { resourcesMarkdown } from "@/lib/resourcesMarkdown";
import { resourceViewPages, stageViews, typeViews } from "@/lib/resourceViews";

import { resourceStages, resourceTypes } from "@/types/resources";

const all = resourceGroups.flatMap((group) => group.resources);

describe("resourceGroups", () => {
  it("has unique group anchors", () => {
    const ids = resourceGroups.map((group) => group.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("lists each resource once, with a valid http(s) URL and a description", () => {
    assert.equal(new Set(all.map((r) => r.url)).size, all.length);
    for (const resource of all) {
      assert.match(resource.url, /^https?:\/\/[^\s]+$/, resource.name);
      assert.ok(resource.description.trim().length > 0, resource.name);
    }
  });

  it("gives each resource a unique slug, used for its anchor and logo file", () => {
    const slugs = all.map(resourceSlug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.equal(resourceSlug({ name: "#LatinaGeeks" }), "latinageeks");
  });

  it("links every category page from llms.txt", () => {
    const llms = readFileSync("public/llms.txt", "utf8");
    for (const group of resourceGroups) {
      assert.ok(llms.includes(`https://latina.dev/resources/${group.id})`), group.id);
    }
  });
});

describe("type and stage pages", () => {
  it("gives a page to every view with enough resources that no category already covers", () => {
    const paths = resourceViewPages.map((view) => view.path);
    assert.ok(paths.includes("/resources/stage/leadership"));
    assert.ok(paths.includes("/resources/type/job-board"));
    assert.equal(new Set(paths).size, paths.length);
    for (const view of resourceViewPages) assert.ok(view.count >= 3, view.value);
  });

  it("points a view at the category page when both list the same resources", () => {
    const k12 = stageViews.find((view) => view.value === "K-12");
    assert.equal(k12?.ownPage, false);
    assert.equal(k12?.path, "/resources/k-12");
  });

  it("only lists resources that carry the tag", () => {
    for (const view of typeViews) {
      const listed = view.groups.flatMap((group) => group.resources);
      assert.equal(listed.length, view.count);
      assert.ok(listed.every((resource) => (resource.types as string[]).includes(view.value)));
    }
  });

  it("uses a heading no category page already has", () => {
    const headings = [...resourceGroups, ...resourceViewPages].map((page) => page.heading);
    assert.equal(new Set(headings).size, headings.length);
  });

  it("links every type and stage page from llms.txt, by its heading", () => {
    const llms = readFileSync("public/llms.txt", "utf8");
    for (const view of resourceViewPages) {
      assert.ok(llms.includes(`[${view.heading}](https://latina.dev${view.path})`), view.path);
    }
  });

  it("puts type, stage and audience in the Markdown feed", () => {
    const markdown = resourcesMarkdown();
    assert.match(
      markdown,
      /- \[Techqueria\]\(https:\/\/techqueria\.org\/\): .+ \(Type: .*Community.*\. Stage: .+\. Built for: Latinos\.\)/
    );
    for (const view of resourceViewPages) assert.ok(markdown.includes(view.path), view.path);
  });
});

describe("resource order", () => {
  it("lists each category A to Z, ignoring punctuation", () => {
    for (const group of resourceGroups) {
      const names = group.resources.map((r) =>
        r.name.replace(/[^\p{L}\p{N} ]/gu, "").toLowerCase()
      );
      assert.deepEqual(
        names,
        [...names].sort((a, b) => a.localeCompare(b, "en"))
      );
    }
  });
});

describe("resource logos", () => {
  it("has a logo for every resource", () => {
    const logos = new Set(
      readdirSync("public/img/resources").map((file) => file.replace(/\.\w+$/, ""))
    );
    const missing = resourceGroups
      .flatMap((group) => group.resources.map(resourceSlug))
      .filter((slug) => !logos.has(slug));
    assert.deepEqual(missing, []);
  });
});

describe("resourceFaqs", () => {
  it("answers each category's question with its resources and page", () => {
    const faqs = resourceFaqs();
    assert.equal(faqs.length, resourceGroups.length);
    resourceGroups.forEach((group, i) => {
      assert.equal(faqs[i].question, group.question);
      for (const resource of group.resources) assert.ok(faqs[i].answer.includes(resource.name));
      assert.ok(faqs[i].answer.endsWith(`/resources/${group.id}`));
    });
  });
});

describe("resourcesJsonLd", () => {
  it("lists every resource in order in an ItemList", () => {
    const data = resourcesJsonLd({
      name: "Resources",
      path: "/resources",
      description: "desc",
    }) as {
      "@type": string;
      mainEntity: {
        numberOfItems: number;
        itemListElement: { position: number; item: { name: string } }[];
      };
    };
    assert.equal(data["@type"], "CollectionPage");
    assert.equal(data.mainEntity.numberOfItems, resourceCount);
    assert.deepEqual(
      data.mainEntity.itemListElement.map((el) => el.item.name),
      all.map((r) => r.name)
    );
    assert.deepEqual(
      data.mainEntity.itemListElement.map((el) => el.position),
      all.map((_, i) => i + 1)
    );
  });
});

describe("resource files", () => {
  it("has one file per resource, named by its slug", () => {
    const files = readdirSync("data/resources").map((file) => file.replace(/\.md$/, ""));
    assert.deepEqual(files.sort(), all.map(resourceSlug).sort());
  });

  it("offers every type and stage filter that a resource uses", () => {
    for (const resource of all) {
      for (const type of resource.types) assert.ok(resourceTypes.includes(type), resource.name);
      for (const stage of resource.stages) assert.ok(resourceStages.includes(stage), resource.name);
    }
  });
});

describe("resourceFrontmatterSchema", () => {
  const valid = {
    name: "Latinas in Tech",
    url: "https://latinasintech.org/",
    description: "Nonprofit with local chapters.",
    group: "latina-communities",
    types: ["Community"],
    stages: ["Workplace"],
    serves: ["Latinas"],
  };

  it("accepts a complete resource", () => {
    assert.equal(validateResourceFrontmatter("latinas-in-tech.md", valid).success, true);
  });

  it("rejects unknown keys, unknown options, repeats and non-http links", () => {
    const bad = [
      { ...valid, stage: "Workplace" },
      { ...valid, types: ["Club"] },
      { ...valid, stages: [] },
      { ...valid, serves: ["Latinas", "Latinas"] },
      { ...valid, group: "misc" },
      { ...valid, url: "javascript:alert(1)" },
      { ...valid, description: " padded " },
    ];
    for (const data of bad) {
      const result = validateResourceFrontmatter("latinas-in-tech.md", data);
      assert.equal(result.success, false, JSON.stringify(data));
      if (!result.success) assert.match(result.error, /^data\/resources\/latinas-in-tech\.md\n/);
    }
  });
});
