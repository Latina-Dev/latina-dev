import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  breadcrumbJsonLd,
  faqJsonLd,
  memberSameAs,
  membersCollectionJsonLd,
  organizationId,
  organizationJsonLd,
  personJsonLd,
  profilePageJsonLd,
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

describe("profilePageJsonLd", () => {
  it("wraps the Person as the main entity of a ProfilePage", () => {
    const page = profilePageJsonLd(member(), new Date("2025-03-04T05:06:07Z"));

    assert.equal(page["@type"], "ProfilePage");
    assert.equal(page.url, "https://latina.dev/members/ana-example");
    assert.equal(page.dateCreated, "2024-01-01");
    assert.equal(page.dateModified, "2025-03-04T05:06:07.000Z");
    const { "@context": _context, ...person } = personJsonLd(member());
    assert.deepEqual(page.mainEntity, person);
  });

  it("leaves out dateModified when it is unknown", () => {
    assert.equal(profilePageJsonLd(member()).dateModified, undefined);
  });
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
    assert.deepEqual(person.homeLocation, { "@type": "Place", name: "Austin, TX" });
  });

  it("skips blank optional fields", () => {
    const person = personJsonLd(member({ affiliation: "  ", github: "" }));

    assert.equal("jobTitle" in person, false);
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

describe("membersCollectionJsonLd with options", () => {
  it("describes a filtered view at its own URL", () => {
    const collection = membersCollectionJsonLd([member()], {
      name: "Latina Engineering Leaders",
      path: "/members/leaders",
      description: "1 Latina engineering leader.",
    });

    assert.equal(collection.name, "Latina Engineering Leaders");
    assert.equal(collection.url, "https://latina.dev/members/leaders");
    assert.equal(collection.description, "1 Latina engineering leader.");
  });
});

describe("faqJsonLd", () => {
  it("turns questions and answers into an FAQPage", () => {
    assert.deepEqual(faqJsonLd([{ question: "Who can join?", answer: "Latinas who code." }]), {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Who can join?",
          acceptedAnswer: { "@type": "Answer", text: "Latinas who code." },
        },
      ],
    });
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
