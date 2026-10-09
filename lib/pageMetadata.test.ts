import assert from "node:assert/strict";
import { test } from "node:test";

import { pageMetadata } from "./pageMetadata";

test("pageMetadata sets canonical, Open Graph and Twitter fields from one title", () => {
  const metadata = pageMetadata({
    title: "Members",
    description: "Browse members.",
    path: "/members",
  });

  assert.equal(metadata.title, "Members");
  assert.deepEqual(metadata.alternates, { canonical: "/members" });
  assert.equal(metadata.openGraph?.title, "Members | Latina Dev");
  assert.equal(metadata.openGraph?.url, "https://latina.dev/members");
  assert.equal(metadata.twitter?.title, "Members | Latina Dev");
  assert.equal((metadata.twitter as { card?: string }).card, "summary_large_image");
  assert.ok(metadata.openGraph?.images);
});

test("pageMetadata keeps absolute titles and can leave the image to an opengraph-image file", () => {
  const metadata = pageMetadata({
    title: "Latina Dev | Directory",
    description: "Home.",
    path: "/",
    absolute: true,
    defaultImage: false,
    type: "profile",
  });

  assert.deepEqual(metadata.title, { absolute: "Latina Dev | Directory" });
  assert.equal(metadata.openGraph?.title, "Latina Dev | Directory");
  assert.equal(metadata.openGraph?.url, "https://latina.dev/");
  assert.equal(metadata.openGraph?.images, undefined);
  assert.equal(metadata.twitter?.images, undefined);
});
