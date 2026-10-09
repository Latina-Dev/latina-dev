import { siteName, siteUrl } from "@/lib/site";

import type { Metadata } from "next";

export const defaultSocialImage = {
  url: "/img/featured-image.png",
  width: 1200,
  height: 630,
  alt: siteName,
};

interface PageMetadataOptions {
  // Title for the <title> tag. Gets the " | Latina Dev" suffix unless absolute is set.
  title: string;
  description: string;
  // Canonical path, e.g. /members
  path: string;
  absolute?: boolean;
  // Leave false for routes with their own opengraph-image file, which Next.js adds itself
  defaultImage?: boolean;
  type?: "website" | "profile";
}

// Next.js replaces the parent's openGraph and twitter objects instead of merging them,
// so every route builds both here to keep the url, site name, image and card type.
export function pageMetadata({
  title,
  description,
  path,
  absolute = false,
  defaultImage = true,
  type = "website",
}: PageMetadataOptions): Metadata {
  const socialTitle = absolute ? title : `${title} | ${siteName}`;
  const images = defaultImage ? [defaultSocialImage] : undefined;

  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: new URL(path, siteUrl).toString(),
      siteName,
      locale: "en_US",
      title: socialTitle,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      ...(images ? { images } : {}),
    },
  };
}
