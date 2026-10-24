// Shared pieces of the link checks: the monthly /resources audit and the member link check

export const userAgent =
  "Mozilla/5.0 (compatible; LatinaDevLinkAudit/1.0; +https://github.com/Latina-Dev/latina-dev)";

export const parkedPatterns = [
  /domain (is )?for sale/i,
  /buy this domain/i,
  /this domain (name )?(has expired|may be for sale|is parked)/i,
  /parked (free|domain)/i,
  /hugedomains|sedo\.com|dan\.com|afternic|godaddy\.com\/domains/i,
  /\b(casino|slot ?gacor|judi|togel|sportsbook|betting|poker online|bandar)\b/i,
  /\b(viagra|cialis|payday loans?)\b/i,
];

// Text a visitor would see, so URLs and words inside scripts, styles or comments don't match
export const visibleText = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");

/**
 * What a member link check found
 * - ok: the page loads
 * - moved: every redirect was permanent (301 or 308), so the link should point at `to`
 * - dead: the page is gone for every visitor (no such domain, refused, bad certificate, 404, 410,
 *   or a parked domain)
 * - unsure: a timeout, a bot block (401, 403, 429, 999) or a server error; could be temporary, so
 *   it is reported but never fails a check or removes a link
 */
export type LinkResult =
  | { status: "ok" }
  | { status: "moved"; to: string }
  | { status: "dead"; reason: string }
  | { status: "unsure"; reason: string };

// Network errors that a visitor's browser would also fail on
const deadErrorCodes = new Set([
  "ENOTFOUND",
  "ECONNREFUSED",
  "CERT_HAS_EXPIRED",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
]);

const errorCode = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) return undefined;
  const cause = error.cause as { code?: string } | undefined;
  return cause?.code ?? (error as { code?: string }).code;
};

/** Same page, ignoring a trailing slash, e.g. https://a.com and https://a.com/ */
export const sameUrl = (a: string, b: string) => {
  const strip = (url: string) => new URL(url).href.replace(/\/$/, "");
  return strip(a) === strip(b);
};

type Fetch = typeof fetch;

/**
 * Open a page the way a visitor would, following redirects by hand to see whether they're permanent
 * @param url page to check
 * @param fetchImpl fetch, swappable in tests
 */
export async function checkPage(url: string, fetchImpl: Fetch = fetch): Promise<LinkResult> {
  let current = url;
  let allPermanent = true;

  try {
    for (let hop = 0; hop < 10; hop++) {
      const response = await fetchImpl(current, {
        redirect: "manual",
        headers: { "user-agent": userAgent, accept: "text/html,*/*" },
        signal: AbortSignal.timeout(20_000),
      });

      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        if (![301, 308].includes(response.status)) allPermanent = false;
        current = new URL(location, current).href;
        await response.body?.cancel();
        continue;
      }

      if ([404, 410].includes(response.status)) {
        return { status: "dead", reason: `the page answered ${response.status} (not found)` };
      }
      if (!response.ok) {
        return { status: "unsure", reason: `the site answered ${response.status}` };
      }

      const type = response.headers.get("content-type") ?? "";
      if (type.includes("text/html")) {
        const text = visibleText((await response.text()).slice(0, 500_000));
        if (parkedPatterns.some((pattern) => pattern.test(text))) {
          return { status: "dead", reason: "the domain looks parked or taken over by spam" };
        }
      }

      if (allPermanent && !sameUrl(url, current)) return { status: "moved", to: current };
      return { status: "ok" };
    }
    return { status: "unsure", reason: "too many redirects" };
  } catch (error) {
    const code = errorCode(error);
    if (code && deadErrorCodes.has(code)) {
      return { status: "dead", reason: `the site can't be reached (${code})` };
    }
    const reason = code ?? (error instanceof Error ? error.message : String(error));
    return { status: "unsure", reason: `the site didn't answer (${reason})` };
  }
}

/**
 * Check that a GitHub account still exists. Renamed accounts don't redirect, so a 404 means the
 * username is gone.
 * @param username GitHub username
 * @param token optional token, for a higher rate limit
 * @param fetchImpl fetch, swappable in tests
 */
export async function checkGitHubUser(
  username: string,
  token?: string,
  fetchImpl: Fetch = fetch
): Promise<LinkResult> {
  try {
    const response = await fetchImpl(`https://api.github.com/users/${username}`, {
      headers: {
        "user-agent": userAgent,
        accept: "application/vnd.github+json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 404) {
      return { status: "dead", reason: "no GitHub account has this username anymore" };
    }
    if (!response.ok) return { status: "unsure", reason: `GitHub answered ${response.status}` };
    return { status: "ok" };
  } catch (error) {
    const reason = errorCode(error) ?? (error instanceof Error ? error.message : String(error));
    return { status: "unsure", reason: `GitHub didn't answer (${reason})` };
  }
}

/**
 * Check again before calling a link dead, so a one-off network blip never removes a link
 * @param check runs one check
 * @param attempts total tries while the result stays dead
 * @param delayMs wait between tries
 */
export async function confirmDead(
  check: () => Promise<LinkResult>,
  attempts = 3,
  delayMs = 5_000
): Promise<LinkResult> {
  let result = await check();
  for (let i = 1; i < attempts && result.status === "dead"; i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    result = await check();
  }
  return result;
}

/**
 * Set or remove one top-level key in a profile's frontmatter, leaving every other line as it is
 * @param markdown profile file contents
 * @param key frontmatter key, e.g. website
 * @param value new value, or null to remove the key
 * @returns updated file contents
 * @throws if the key isn't in the frontmatter
 */
export const setFrontmatterField = (markdown: string, key: string, value: string | null) => {
  const end = markdown.indexOf("\n---", 3);
  if (!markdown.startsWith("---") || end === -1) throw new Error("no frontmatter");
  const frontmatter = markdown.slice(0, end + 1);
  const line = new RegExp(`^${key}:.*(?:\\r?\\n|$)`, "m");
  if (!line.test(frontmatter)) throw new Error(`no ${key} in frontmatter`);
  const replacement = value === null ? "" : `${key}: ${JSON.stringify(value)}\n`;
  return frontmatter.replace(line, replacement) + markdown.slice(end + 1);
};
