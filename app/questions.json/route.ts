import { getQuestions, questionForAgents, questionsPath } from "@/lib/questions";
import { siteUrl } from "@/lib/site";

// Build this feed once at build time, like /resources.json
export const dynamic = "force-static";

/** Every answered question from the members' Slack, for agents and integrations */
export async function GET() {
  const questions = getQuestions();
  return Response.json({
    site: siteUrl,
    url: `${siteUrl}${questionsPath}`,
    count: questions.length,
    questions: questions.map(questionForAgents),
  });
}
