import { readFileSync } from "fs";
import { chromium } from "@playwright/test";

// Shared pieces for the LinkedIn share images drafted by the monthly post and weekly spotlight.
// 1200×627 is LinkedIn's size for a shared image.

export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const dataUri = (path: string, type: string) =>
  `data:${type};base64,${readFileSync(path).toString("base64")}`;

/** A member's photo as a data URI, or undefined if they don't have one yet */
export const memberPhoto = (slug: string) => {
  try {
    return dataUri(`public/img/members/${slug}.jpg`, "image/jpeg");
  } catch {
    return undefined;
  }
};

/** The site's Latina font at the weights the images use */
export const fontFaces = () =>
  (
    [
      [500, "Latina-Medium"],
      [700, "Latina-Bold"],
      [900, "Latina-Heavy"],
    ] as const
  )
    .map(
      ([weight, file]) =>
        `@font-face { font-family: Latina; font-weight: ${weight}; src: url(${dataUri(`public/fonts/${file}.woff2`, "font/woff2")}); }`
    )
    .join("\n");

export const owlMark = () => dataUri("public/img/logos/owl-mark-white.svg", "image/svg+xml");

/** Screenshot a 1200×627 HTML page to `path` */
export const renderShareImage = async (html: string, path: string) => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 627 } });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path });
  } finally {
    await browser.close();
  }
};
