import { ergsMarkdown } from "@/lib/ergs";

export const dynamic = "force-static";

/** Every ERG as plain Markdown, the easiest format for an AI assistant to read and quote */
export async function GET() {
  return new Response(ergsMarkdown(), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
