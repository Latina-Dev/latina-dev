import { siteDescription, siteName, siteUrl } from "@/lib/site";

import { MemberInterface } from "@/types/members";

// Builders for the schema.org JSON-LD blocks rendered on each page. They only use fields that
// exist in member data, and leave out anything a member hasn't filled in.

type JsonLd = Record<string, unknown>;

export const organizationId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;

// Named as well as referenced by @id, so pages that don't carry the full Organization block still
// say who the member belongs to
const organizationRef = {
  "@type": "Organization",
  "@id": organizationId,
  name: siteName,
  url: siteUrl,
};

const absolute = (path: string) => (path === "/" ? siteUrl : `${siteUrl}${path}`);

const clean = (value?: string) => {
  const v = value?.trim();
  return v ? v : undefined;
};

/** Links to a member's profiles elsewhere, for `sameAs` */
export const memberSameAs = (member: MemberInterface): string[] => {
  const linkedin = clean(member.linkedin);
  const github = clean(member.github);
  const twitter = clean(member.twitter);
  const website = clean(member.website);

  return [
    linkedin && `https://www.linkedin.com/in/${encodeURIComponent(linkedin)}`,
    github && `https://github.com/${encodeURIComponent(github)}`,
    twitter && `https://x.com/${encodeURIComponent(twitter)}`,
    website,
  ].filter((url): url is string => Boolean(url));
};

/** Latina Dev as an Organization, referenced by every Person through `memberOf` */
export const organizationJsonLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": organizationId,
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/img/logos/logo.png`,
  description: siteDescription,
  sameAs: ["https://www.linkedin.com/company/latina-dev/", "https://github.com/Latina-Dev"],
});

/** The site itself, published by the Organization */
export const websiteJsonLd = (): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": websiteId,
  name: siteName,
  url: siteUrl,
  description: siteDescription,
  publisher: organizationRef,
  inLanguage: "en",
});

/** The fields of a Person, without @context, so it can also sit inside an ItemList */
const personFields = (member: MemberInterface): JsonLd => {
  const sameAs = memberSameAs(member);
  const affiliation = clean(member.affiliation);
  const location = clean(member.location);

  return {
    "@type": "Person",
    "@id": `${absolute(member.path)}#person`,
    name: member.name,
    url: absolute(member.path),
    image: `${siteUrl}/img/members/${member.slug}.jpg`,
    ...(affiliation ? { jobTitle: affiliation } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(location ? { homeLocation: { "@type": "Place", name: location } } : {}),
    memberOf: organizationRef,
  };
};

/** A member's profile page */
export const personJsonLd = (member: MemberInterface): JsonLd => ({
  "@context": "https://schema.org",
  ...personFields(member),
});

/**
 * A member's profile page as Google's ProfilePage rich result: the Person is the main entity.
 * dateCreated is when they joined the directory; dateModified is when their file last changed.
 */
export const profilePageJsonLd = (member: MemberInterface, dateModified?: Date): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": absolute(member.path),
  url: absolute(member.path),
  name: member.name,
  dateCreated: member.added,
  ...(dateModified ? { dateModified: dateModified.toISOString() } : {}),
  isPartOf: { "@id": websiteId },
  mainEntity: personFields(member),
});

interface CollectionOptions {
  name: string;
  path: string;
  description: string;
}

/**
 * A directory page: a CollectionPage holding an ItemList of every indexable member it shows.
 * Defaults describe the full directory at /members.
 */
export const membersCollectionJsonLd = (
  members: MemberInterface[],
  options?: CollectionOptions
): JsonLd => {
  const listed = members.filter((member) => !member.noindex);
  const { name, path, description } = options ?? {
    name: "Latina Dev members",
    path: "/members",
    description: `A directory of ${listed.length} Latina software engineers, from students to engineering leaders.`,
  };

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: absolute(path),
    description,
    isPartOf: { "@id": websiteId },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: listed.length,
      itemListElement: listed.map((member, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absolute(member.path),
        item: personFields(member),
      })),
    },
  };
};

/** Questions and answers shown on the page, as plain text */
export const faqJsonLd = (faqs: { question: string; answer: string }[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
});

/** A breadcrumb trail, e.g. Home › Members › Name. Paths are relative to the site root. */
export const breadcrumbJsonLd = (items: { name: string; path: string }[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absolute(item.path),
  })),
});

/**
 * Serialize JSON-LD for a <script> tag. Escapes <, > and & so text in member data can't close the
 * script element.
 */
export const serializeJsonLd = (data: JsonLd | JsonLd[]) =>
  JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
