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
        "https://a.dev/": redirect(308, "https://www.a.dev/me"),
        "https://www.a.dev/me": page(),
      })
    );
    assert.deepEqual(result, { status: "moved", to: "https://www.a.dev/me" });
  });

  it("only reports a permanent redirect to another site, since a lapsed domain can go anywhere", async () => {
    const result = await checkPage(
      "https://a.dev/",
      fakeFetch({
        "https://a.dev/": redirect(301, "https://other.dev/"),
        "https://other.dev/": page(),
      })
    );
    assert.deepEqual(result, {
      status: "unsure",
      reason: "redirects to another site: https://other.dev/",
    });
  });

  it("treats each site on a shared host like Netlify as its own site", async () => {
    const result = await checkPage(
      "https://ana.netlify.app/",
      fakeFetch({
        "https://ana.netlify.app/": redirect(301, "https://spam.netlify.app/"),
        "https://spam.netlify.app/": page(),
      })
    );
    assert.equal(result.status, "unsure");
  });

  it("only reports a deep link that now redirects to the homepage", async () => {
    const result = await checkPage(
      "https://a.dev/portfolio",
      fakeFetch({ "https://a.dev/portfolio": redirect(301, "/"), "https://a.dev/": page() })
    );
    assert.equal(result.status, "unsure");
  });

  it("only reports a move to http or to an address with a query", async () => {
    const result = (from: string, to: string) =>
      checkPage(from, fakeFetch({ [from]: redirect(301, to), [to]: page() }));
    assert.equal((await result("https://a.dev/", "http://a.dev/")).status, "unsure");
    assert.equal((await result("https://a.dev/", "https://a.dev/?session=1")).status, "unsure");
  });

  it("checks the page a redirect lands on", async () => {
    const result = await checkPage(
      "https://a.dev/",
      fakeFetch({ "https://a.dev/": redirect(301, "/me"), "https://a.dev/me": page("", 404) })
    );
    assert.equal(result.status, "dead");
  });

  it("doesn't call a full page dead because it mentions buying a domain", async () => {
    const post = `<h1>How I named my startup</h1><p>${"I looked at a domain for sale on dan.com. ".repeat(60)}</p>`;
    const result = await checkPage(
      "https://blog.dev/",
      fakeFetch({ "https://blog.dev/": page(post) })
    );
    assert.deepEqual(result, { status: "ok" });
  });

  it("doesn't call a short page dead because its text mentions a domain for sale", async () => {
    const result = await checkPage(
      "https://ana.dev/",
      fakeFetch({
        "https://ana.dev/": page(
          "<h1>Ana López</h1><p>I bought this name on dan.com. Buy this domain? No.</p>"
        ),
      })
    );
    assert.deepEqual(result, { status: "ok" });
  });

  it("doesn't mistake a name or an address for a parked domain", async () => {
    const result = await checkPage(
      "https://judi.dev/",
      fakeFetch({ "https://judi.dev/": page("<p>Hi, I'm Judi. Email me at hi@brendan.com</p>") })
    );
    assert.deepEqual(result, { status: "ok" });
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
      "https://sedo.dev/": page("<title>Make an offer at www.sedo.com</title>"),
      "https://afternic.dev/": page("<h1>Listed on Afternic</h1><p>Contact us</p>"),
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

  it("writes a URL with $ in it as is", () => {
    assert.match(
      setFrontmatterField(profile, "website", "https://ana.dev/?x=$1&y=$&"),
      /^website: "https:\/\/ana\.dev\/\?x=\$1&y=\$&"$/m
    );
  });

  it("refuses a value that spans several lines, rather than breaking the file", () => {
    const folded = `---\nname: Ana\nwebsite: >-\n  https://ana.dev\n---\n`;
    assert.throws(() => setFrontmatterField(folded, "website", null));
    const continued = `---\nname: Ana\nwebsite: https://ana.dev/a\n  /b\n---\n`;
    assert.throws(() => setFrontmatterField(continued, "website", null));
  });

  it("keeps Windows line endings", () => {
    const crlf = `---\r\nname: Ana\r\nwebsite: "http://ana.dev"\r\n---\r\n`;
    assert.equal(
      setFrontmatterField(crlf, "website", "https://ana.dev/"),
      `---\r\nname: Ana\r\nwebsite: "https://ana.dev/"\r\n---\r\n`
    );
  });

  it("finds the closing --- line exactly", () => {
    const ruled = `---\nname: Ana\nwebsite: "https://ana.dev"\n---\n\n----\nwebsite: in the bio\n`;
    assert.equal(
      setFrontmatterField(ruled, "website", null),
      `---\nname: Ana\n---\n\n----\nwebsite: in the bio\n`
    );
  });

  it("throws when the key isn't in the frontmatter", () => {
    assert.throws(() => setFrontmatterField(profile, "github", null));
  });
});
