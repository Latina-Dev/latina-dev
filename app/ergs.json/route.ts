import { ergDescription, ergGuidePath, ergPage, ergs, ergsPath } from "@/lib/ergs";
import { siteUrl } from "@/lib/site";

// Build this feed once at build time, like /members.json
export const dynamic = "force-static";

/** Machine-readable list of every ERG on /ergs, for agents and integrations */
export async function GET() {
  return Response.json({
    site: siteUrl,
    url: `${siteUrl}${ergsPath}`,
    count: ergs.length,
    guide: `${siteUrl}${ergGuidePath}`,
    ergs: ergs.map((erg) => ({
      company: erg.company,
      name: erg.name,
      description: ergDescription(erg),
      source: erg.url,
      checked: erg.checked,
      page: ergPage(erg),
    })),
  });
}
