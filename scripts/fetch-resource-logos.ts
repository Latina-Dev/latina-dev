import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import path from "path";

import { resourceGroups, resourceSlug } from "@/lib/resources";

// Downloads a small logo for each resource on /resources into public/img/resources/<slug>.<ext>.
// Only resources without a logo are fetched, so a logo replaced by hand stays put. Tries the icons a
// site declares (apple-touch-icon first, since it is the largest), then /favicon.ico, then Google's
// favicon service. SVGs are skipped because they can carry scripts. Cards without a logo show the
// resource's initials instead.

const outDir = "public/img/resources";
const maxBytes = 200_000;
const userAgent =
  "Mozilla/5.0 (compatible; LatinaDevLogoFetch/1.0; +https://github.com/Latina-Dev/latina-dev)";

// Detect the format from the file's first bytes rather than trusting headers or extensions
const sniff = (bytes: Uint8Array): string | null => {
  const hex = Buffer.from(bytes.slice(0, 12)).toString("hex");
  if (hex.startsWith("89504e47")) return "png";
  if (hex.startsWith("ffd8ff")) return "jpg";
  if (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250") return "webp";
  if (hex.startsWith("00000100")) return "ico";
  return null;
};

const get = (url: string) =>
  fetch(url, {
    redirect: "follow",
    headers: { "user-agent": userAgent },
    signal: AbortSignal.timeout(15_000),
  });

async function iconCandidates(siteUrl: string): Promise<string[]> {
  const candidates: { href: string; rank: number }[] = [];
  try {
    const response = await get(siteUrl);
    const html = (await response.text()).slice(0, 300_000);
    for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
      const rel = /rel=["']([^"']+)["']/i.exec(tag)?.[1].toLowerCase() ?? "";
      const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
      if (!href || !/icon/.test(rel) || /\.svg(\?|$)/i.test(href)) continue;
      const size = Number(/sizes=["'](\d+)x\d+["']/i.exec(tag)?.[1] ?? 0);
      const rank = (rel.includes("apple-touch-icon") ? 1000 : 0) + size;
      candidates.push({ href: new URL(href, response.url).href, rank });
    }
  } catch {
    // Fall through to the defaults below
  }
  const host = new URL(siteUrl).hostname;
  return [
    ...candidates.sort((a, b) => b.rank - a.rank).map((c) => c.href),
    new URL("/apple-touch-icon.png", siteUrl).href,
    new URL("/favicon.ico", siteUrl).href,
    `https://www.google.com/s2/favicons?domain=${host}&sz=128`,
  ];
}

async function fetchLogo(siteUrl: string): Promise<{ bytes: Uint8Array; ext: string } | null> {
  for (const candidate of await iconCandidates(siteUrl)) {
    try {
      const response = await get(candidate);
      if (!response.ok) continue;
      const bytes = new Uint8Array(await response.arrayBuffer());
      const ext = sniff(bytes);
      // Tiny files are usually blank placeholders
      if (ext && bytes.length > 200 && bytes.length <= maxBytes) return { bytes, ext };
    } catch {
      // Try the next candidate
    }
  }
  return null;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const existing = new Set(readdirSync(outDir).map((file) => file.replace(/\.[a-z]+$/, "")));
  const missing = resourceGroups
    .flatMap((group) => group.resources)
    .filter((resource) => !existing.has(resourceSlug(resource)));

  for (const resource of missing) {
    const slug = resourceSlug(resource);
    const logo = await fetchLogo(resource.url);
    if (!logo) {
      console.log(`no logo: ${resource.name}`);
      continue;
    }
    const file = path.join(outDir, `${slug}.${logo.ext}`);
    if (!existsSync(file)) writeFileSync(file, logo.bytes);
    console.log(`saved ${file}`);
  }
}

main();
