// Links from latina.dev to the organizations it lists (resources and ERGs) carry a referral tag, so
// each organization can see in its own analytics that visitors came from Latina Dev. A click on
// one is also counted as a Vercel Web Analytics event, with the organization's name and nothing
// about the visitor, so a monthly report can show each organization what Latina Dev sent them.

export const referralSource = "latina.dev";

/** Name of the Vercel Web Analytics event sent when someone opens a listed organization's link */
export const outboundClickEvent = "Outbound click";

/** What kind of listing a link belongs to, sent with the click and used to group the report */
export type OutboundKind = "resource" | "erg";

/**
 * `url` with utm_source=latina.dev and utm_medium=referral added, so the organization's own
 * analytics credit Latina Dev. A link that already sets utm_source is left alone, as is anything
 * that isn't a plain http(s) URL.
 */
export const withReferral = (url: string) => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!/^https?:$/.test(parsed.protocol) || parsed.searchParams.has("utm_source")) return url;
  parsed.searchParams.set("utm_source", referralSource);
  if (!parsed.searchParams.has("utm_medium")) parsed.searchParams.set("utm_medium", "referral");
  return parsed.toString();
};

/** Props for an `<a>` to a listed organization: the tagged URL plus what the click counter reads */
export const outboundLinkProps = (kind: OutboundKind, org: string, url: string) => ({
  href: withReferral(url),
  "data-outbound": kind,
  "data-org": org,
});
