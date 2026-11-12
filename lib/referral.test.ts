import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ergs } from "@/lib/ergs";
import { outboundLinkProps, withReferral } from "@/lib/referral";
import { resourceGroups } from "@/lib/resources";

describe("withReferral", () => {
  it("adds utm_source and utm_medium", () => {
    assert.equal(
      withReferral("https://example.org/join"),
      "https://example.org/join?utm_source=latina.dev&utm_medium=referral"
    );
  });

  it("keeps existing query parameters and the fragment", () => {
    assert.equal(
      withReferral("https://example.org/a?b=1#c"),
      "https://example.org/a?b=1&utm_source=latina.dev&utm_medium=referral#c"
    );
  });

  it("leaves a link that already sets utm_source alone", () => {
    const url = "https://example.org/?utm_source=partner";
    assert.equal(withReferral(url), url);
  });

  it("keeps an existing utm_medium", () => {
    assert.equal(
      withReferral("https://example.org/?utm_medium=email"),
      "https://example.org/?utm_medium=email&utm_source=latina.dev"
    );
  });

  it("leaves non-web and unparseable links alone", () => {
    assert.equal(withReferral("mailto:hola@latina.dev"), "mailto:hola@latina.dev");
    assert.equal(withReferral("/resources"), "/resources");
  });

  it("tags every listed resource and ERG link", () => {
    const urls = [
      ...resourceGroups.flatMap((group) => group.resources.map((resource) => resource.url)),
      ...ergs.map((erg) => erg.url),
    ];
    for (const url of urls) {
      assert.equal(new URL(withReferral(url)).searchParams.has("utm_source"), true, url);
    }
  });
});

describe("outboundLinkProps", () => {
  it("returns the tagged link and what the click counter reads", () => {
    assert.deepEqual(outboundLinkProps("erg", "Acme", "https://acme.com/somos"), {
      href: "https://acme.com/somos?utm_source=latina.dev&utm_medium=referral",
      "data-outbound": "erg",
      "data-org": "Acme",
    });
  });
});
