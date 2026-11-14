import { questionsMarkdown } from "@/lib/questions";

export const dynamic = "force-static";

/** Every question and answer as plain Markdown, the easiest format for an AI assistant to read */
export async function GET() {
  return new Response(questionsMarkdown(), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
