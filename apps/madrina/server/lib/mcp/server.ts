import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getGaps,
  getProfile,
  ladder,
  matchedShelf,
  resources,
} from "~/lib/madrina/data";
import { listWins } from "~/lib/madrina/store";

const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

const readOnly = { readOnlyHint: true, openWorldHint: false };

const competency = z
  .enum(ladder.competencies as [string, ...string[]])
  .optional();

/**
 * Madrina's data core as read-only MCP tools, so a personal Claude can answer
 * "am I on track for Staff?" from the same profile, gaps and wins as Slack.
 * The bearer token stands for the demo user (Ana), so no tool takes a user id.
 */
export const createMadrinaMcpServer = () => {
  const server = new McpServer({ name: "madrina", version: "0.1.0" });

  server.registerTool(
    "get_profile",
    {
      title: "Get my career profile",
      description:
        "Current level, target level, track, top gaps to the target level " +
        "(self-assessment vs. the ladder), support system and wins count. " +
        "Synthetic demo data.",
      annotations: readOnly,
    },
    async () => {
      const profile = getProfile();
      return json({
        synthetic: true,
        name: profile.name,
        team: profile.team,
        current_level: profile.current_level,
        target_level: profile.target_level,
        track: profile.track,
        gaps: getGaps(profile).map((g) => ({
          competency: g.competency,
          self_assessed: g.current,
          target: g.target,
          target_expects: g.expectation,
          manager_named_it: g.managerFocus,
        })),
        support_system: profile.support_system,
        wins_logged: listWins(profile.id).length,
      });
    },
  );

  server.registerTool(
    "list_wins",
    {
      title: "List my logged wins",
      description:
        "Promo-ready bullets logged through Madrina in Slack, each mapped to " +
        "a ladder competency. Optionally filter by competency.",
      inputSchema: { competency },
      annotations: readOnly,
    },
    async ({ competency }) => {
      const all = listWins(getProfile().id);
      const wins = competency
        ? all.filter((w) => w.competency === competency)
        : all;
      return json({
        count: wins.length,
        wins: wins.map(({ bullet, competency, at }) => ({
          bullet,
          competency,
          logged_at: at,
        })),
        ...(all.length === 0 && {
          note: "No wins logged yet. Wins live in memory in the Madrina server process; log one by replying to a check-in in Slack.",
        }),
      });
    },
  );

  server.registerTool(
    "recommend",
    {
      title: "Recommend resources for my gaps",
      description:
        "Books, talks and posts by women authors from Madrina's curated " +
        "shelf, matched to her top gaps or to one competency. Only returns " +
        "items from the shelf; never recommend anything else.",
      inputSchema: {
        competency,
        limit: z.number().int().min(1).max(10).optional(),
      },
      annotations: readOnly,
    },
    async ({ competency, limit = 3 }) => {
      const profile = getProfile();
      const gaps = getGaps(profile).map((g) => g.competency);
      const items = competency
        ? resources.resources
            .filter(
              (r) =>
                r.tracks.includes(profile.track) &&
                r.competencies.includes(competency),
            )
            .map((resource) => ({
              resource,
              matched_gap: gaps.includes(competency) ? competency : undefined,
            }))
        : matchedShelf(profile).map(({ resource, gap }) => ({
            resource,
            matched_gap: gap?.competency,
          }));
      return json({
        source: "Madrina's curated shelf (data/resources.json)",
        recommendations: items
          .slice(0, limit)
          .map(({ resource: r, matched_gap }) => ({
            title: r.title,
            author: r.author,
            type: r.type,
            url: r.url,
            competencies: r.competencies,
            matched_gap,
          })),
      });
    },
  );

  return server;
};
