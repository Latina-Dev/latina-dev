import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  breadcrumbJsonLd,
  memberSameAs,
  membersCollectionJsonLd,
  organizationId,
  organizationJsonLd,
  personJsonLd,
  serializeJsonLd,
  websiteJsonLd,
} from "@/lib/jsonLd";

import { MemberInterface } from "@/types/members";

const member = (overrides: Partial<MemberInterface> = {}): MemberInterface => ({
  name: "Ana Example",
  added: "2024-01-01",
  level: "Individual Contributor",
  linkedin: "ana-example",
  slug: "ana-example",
  path: "/members/ana-example",
  ...overrides,
});

describe("personJsonLd", () => {
  it("builds a Person from the required fields only", () => {
    const person = personJsonLd(member());

    assert.deepEqual(person, {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://latina.dev/members/ana-example#person",
      name: "Ana Example",
      url: "https://latina.dev/members/ana-example",
      image: "https://latina.dev/img/members/ana-example.jpg",
      sameAs: ["https://www.linkedin.com/in/ana-example"],
      memberOf: {
        "@type": "Organization",
        "@id": organizationId,
        name: "Latina Dev",
        url: "https://latina.dev",
      },
    });
  });

  it("adds optional fields only when the member has them", () => {
    const person = personJsonLd(
      member({
        affiliation: "Staff Engineer at Acme",
        github: "anaex",
        twitter: "ana_ex",
        website: "https://ana.example",
        skills: ["React"],
        location: "Austin, TX",
      })
    );

    assert.equal(person.jobTitle, "Staff Engineer at Acme");
    assert.deepEqual(person.sameAs, [
      "https://www.linkedin.com/in/ana-example",
      "https://github.com/anaex",
      "https://x.com/ana_ex",
      "https://ana.example",
    ]);
    assert.deepEqual(person.knowsAbout, ["React"]);
    assert.deepEqual(person.homeLocation, { "@type": "Place", name: "Austin, TX" });
  });

  it("skips blank optional fields", () => {
    const person = personJsonLd(member({ affiliation: "  ", github: "", skills: [] }));

    assert.equal("jobTitle" in person, false);
    assert.equal("knowsAbout" in person, false);
    assert.deepEqual(memberSameAs(member({ github: " " })), [
      "https://www.linkedin.com/in/ana-example",
    ]);
  });
});

describe("membersCollectionJsonLd", () => {
  it("lists every member except those with noindex, in order", () => {
    const collection = membersCollectionJsonLd([
      member(),
      member({ name: "Hidden", slug: "hidden", path: "/members/hidden", noindex: true }),
      member({ name: "Bea", slug: "bea", path: "/members/bea" }),
    ]);
    const list = collection.mainEntity as {
      numberOfItems: number;
      itemListElement: { position: number; url: string; item: { name: string } }[];
    };

    assert.equal(collection["@type"], "CollectionPage");
    assert.equal(list.numberOfItems, 2);
    assert.deepEqual(
      list.itemListElement.map(({ position, url, item }) => [position, url, item.name]),
      [
        [1, "https://latina.dev/members/ana-example", "Ana Example"],
        [2, "https://latina.dev/members/bea", "Bea"],
      ]
    );
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers items and makes their URLs absolute", () => {
    assert.deepEqual(
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Members", path: "/members" },
      ]).itemListElement,
      [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://latina.dev" },
        { "@type": "ListItem", position: 2, name: "Members", item: "https://latina.dev/members" },
      ]
    );
  });
});

describe("organization and website", () => {
  it("link the website to the organization by @id", () => {
    assert.equal(organizationJsonLd()["@id"], organizationId);
    assert.equal((websiteJsonLd().publisher as { "@id": string })["@id"], organizationId);
  });
});

describe("serializeJsonLd", () => {
  it("escapes characters that could close the script tag", () => {
    const json = serializeJsonLd({ name: "</script><b>&" });

    assert.equal(json.includes("<"), false);
    assert.equal(json.includes(">"), false);
    assert.deepEqual(JSON.parse(json), { name: "</script><b>&" });
  });
});
