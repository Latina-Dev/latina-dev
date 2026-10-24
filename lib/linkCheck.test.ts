import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  checkGitHubUser,
  checkPage,
  confirmDead,
  LinkResult,
  sameUrl,
  setFrontmatterField,
} from "@/lib/linkCheck";

// A fake fetch that answers each URL from a table, or throws a network error with a code
const fakeFetch =
  (routes: Record<string, Response | string>): typeof fetch =>
  async (input) => {
    const route = routes[String(input)];
    if (route === undefined) throw new Error(`unexpected fetch ${input}`);
    if (typeof route === "string") {
      throw new TypeError("fetch failed", {
        cause: Object.assign(new Error(route), { code: route }),
      });
    }
    return route;
  };

const redirect = (status: number, location: string) =>
  new Response(null, { status, headers: { location } });
const page = (body = "<p>Hola</p>", status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/html" } });

describe("checkPage", () => {
  it("passes a page that loads", async () => {
    assert.deepEqual(await checkPage("https://a.dev/", fakeFetch({ "https://a.dev/": page() })), {
      status: "ok",
    });
  });

  it("follows permanent redirects to the new address", async () => {
    const result = await checkPage(
      "http://a.dev/",
      fakeFetch({
        "http://a.dev/": redirect(301, "https://a.dev/"),
        "https://a.dev/": redirect(308, "https://new.dev/me"),
        "https://new.dev/me": page(),
      })
    );
    assert.deepEqual(result, { status: "moved", to: "https://new.dev/me" });
  });

  it("leaves a link alone when any redirect is temporary", async () => {
    const result = await checkPage(
      "https://a.dev/",
      fakeFetch({
        "https://a.dev/": redirect(302, "/en"),
        "https://a.dev/en": page(),
      })
    );
    assert.deepEqual(result, { status: "ok" });
  });

  it("ignores a redirect that only adds a trailing slash", async () => {
    const result = await checkPage(
      "https://a.dev/blog",
      fakeFetch({ "https://a.dev/blog": redirect(301, "/blog/"), "https://a.dev/blog/": page() })
    );
    assert.deepEqual(result, { status: "ok" });
  });

  it("calls 404, 410, missing domains and parked pages dead", async () => {
    const cases: Record<string, Response | string> = {
      "https://gone.dev/": page("", 404),
      "https://removed.dev/": page("", 410),
      "https://nodomain.dev/": "ENOTFOUND",
      "https://expired.dev/": "CERT_HAS_EXPIRED",
      "https://parked.dev/": page("<h1>This domain is for sale</h1>"),
    };
    for (const url of Object.keys(cases)) {
      assert.equal((await checkPage(url, fakeFetch(cases))).status, "dead", url);
    }
  });

  it("treats timeouts, bot blocks and server errors as unsure", async () => {
    const cases: Record<string, Response | string> = {
      "https://blocked.dev/": page("", 403),
      "https://busy.dev/": page("", 429),
      "https://down.dev/": page("", 503),
      "https://slow.dev/": "UND_ERR_CONNECT_TIMEOUT",
      "https://reset.dev/": "ECONNRESET",
    };
    for (const url of Object.keys(cases)) {
      assert.equal((await checkPage(url, fakeFetch(cases))).status, "unsure", url);
    }
  });
});

describe("checkGitHubUser", () => {
  it("calls a missing account dead and passes one that exists", async () => {
    const fetchImpl = fakeFetch({
      "https://api.github.com/users/gone": new Response("{}", { status: 404 }),
      "https://api.github.com/users/here": new Response("{}", { status: 200 }),
      "https://api.github.com/users/limited": new Response("{}", { status: 403 }),
    });
    assert.equal((await checkGitHubUser("gone", undefined, fetchImpl)).status, "dead");
    assert.equal((await checkGitHubUser("here", undefined, fetchImpl)).status, "ok");
    assert.equal((await checkGitHubUser("limited", undefined, fetchImpl)).status, "unsure");
  });
});

describe("confirmDead", () => {
  it("keeps a link that comes back on a later try", async () => {
    const results: LinkResult[] = [{ status: "dead", reason: "blip" }, { status: "ok" }];
    const result = await confirmDead(async () => results.shift()!, 3, 0);
    assert.deepEqual(result, { status: "ok" });
  });

  it("calls a link dead only when every try fails", async () => {
    let calls = 0;
    const result = await confirmDead(
      async () => {
        calls++;
        return { status: "dead", reason: "gone" };
      },
      3,
      0
    );
    assert.equal(result.status, "dead");
    assert.equal(calls, 3);
  });
});

describe("sameUrl", () => {
  it("ignores only a trailing slash", () => {
    assert.ok(sameUrl("https://a.dev", "https://a.dev/"));
    assert.ok(!sameUrl("http://a.dev/", "https://a.dev/"));
  });
});

describe("setFrontmatterField", () => {
  const profile = `---\nname: Ana\nlinkedin: "ana"\nwebsite: "http://ana.dev"\n---\n\nwebsite: in the bio\n`;

  it("replaces one value and keeps everything else", () => {
    assert.equal(
      setFrontmatterField(profile, "website", "https://ana.dev/"),
      `---\nname: Ana\nlinkedin: "ana"\nwebsite: "https://ana.dev/"\n---\n\nwebsite: in the bio\n`
    );
  });

  it("removes a key, but not matching text in the bio", () => {
    assert.equal(
      setFrontmatterField(profile, "website", null),
      `---\nname: Ana\nlinkedin: "ana"\n---\n\nwebsite: in the bio\n`
    );
  });

  it("throws when the key isn't in the frontmatter", () => {
    assert.throws(() => setFrontmatterField(profile, "github", null));
  });
});
