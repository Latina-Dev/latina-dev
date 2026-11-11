import { resourcesMarkdown } from "@/lib/resourcesMarkdown";

export const dynamic = "force-static";

/** Every resource as plain Markdown, the easiest format for an AI assistant to read and quote */
export async function GET() {
  return new Response(resourcesMarkdown(), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
