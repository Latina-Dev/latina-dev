import type { WebClient } from "@slack/web-api";
import { buildBragDoc } from "~/lib/ai/brag";

export const EXPORT_BRAG_ACTION = "export_brag_doc";

const errorCode = (e: unknown) =>
  (e as { data?: { error?: string } })?.data?.error ?? String(e);

const openDm = async (client: WebClient, userId: string) => {
  const { channel } = await client.conversations.open({ users: userId });
  if (!channel?.id) throw new Error("Could not open DM");
  return channel.id;
};

/** Canvas link from auth.test's workspace URL; Slack unfurls it into a canvas card. */
const canvasLink = async (client: WebClient, canvasId: string) => {
  const auth = await client.auth.test();
  const base = (auth.url ?? "https://slack.com/").replace(/\/$/, "");
  return `${base}/docs/${auth.team_id}/${canvasId}`;
};

type Delivered =
  | { kind: "canvas"; link: string }
  | { kind: "dm_canvas" }
  | { kind: "file"; reason: string };

/**
 * Standalone canvas she can edit and share, falling back to a canvas tab on the DM (free workspaces
 * can't make standalone canvases), then to a Markdown file upload.
 */
const deliver = async (
  client: WebClient,
  userId: string,
  channel: string,
  title: string,
  markdown: string,
): Promise<Delivered> => {
  const document_content = { type: "markdown" as const, markdown };
  try {
    const res = await client.canvases.create({ title, document_content });
    if (!res.canvas_id)
      throw new Error("canvases.create returned no canvas_id");
    // The bot owns it; give her edit access so she can change it and share it with whoever she picks.
    await client.canvases.access.set({
      canvas_id: res.canvas_id,
      access_level: "write",
      user_ids: [userId],
    });
    return { kind: "canvas", link: await canvasLink(client, res.canvas_id) };
  } catch (standaloneError) {
    const first = errorCode(standaloneError);
    try {
      await client.conversations.canvases.create({
        channel_id: channel,
        title,
        document_content,
      });
      return { kind: "dm_canvas" };
    } catch (tabError) {
      const reason = `canvases.create: ${first}; conversations.canvases.create: ${errorCode(tabError)}`;
      await client.filesUploadV2({
        channel_id: channel,
        filename: "brag-doc.md",
        title,
        content: markdown,
        initial_comment:
          "Here's your brag doc as a Markdown file. Open it, edit it, and share it with whoever you choose.",
      });
      return { kind: "file", reason };
    }
  }
};

/** App Home button: build the brag doc from her logged wins and drop it in her DM. */
export const exportBragDoc = async (client: WebClient, userId: string) => {
  const channel = await openDm(client, userId);
  const pending = await client.chat.postMessage({
    channel,
    text: ":promo-ready: Pulling your wins into a brag doc, grouped by competency...",
  });
  try {
    const doc = await buildBragDoc(undefined, userId);
    const delivered = await deliver(
      client,
      userId,
      channel,
      doc.title,
      doc.markdown,
    );
    const covered =
      doc.sections.map((s) => s.competency).join(", ") || "none yet";
    const gaps = doc.gaps.map((g) => g.competency).join(", ");
    const where =
      delivered.kind === "canvas"
        ? `<${delivered.link}|Open your brag doc>. It's yours to edit, and you choose who sees it.`
        : delivered.kind === "dm_canvas"
          ? "It's in the canvas tab at the top of this DM. Edit it, then share it with whoever you choose."
          : "Canvases aren't available here, so I attached it as a Markdown file instead.";
    const text = `:promo-ready: Your brag doc is ready: ${doc.winCount} wins grouped by competency (${covered}).${gaps ? ` No evidence yet for *${gaps}*, so I listed ${doc.gaps.length === 1 ? "it" : "them"} as gaps to work on.` : ""}\n${where}`;
    await client.chat.update({ channel, ts: pending.ts as string, text });
    if (delivered.kind === "file")
      console.warn(`Brag doc fell back to a file upload (${delivered.reason})`);
  } catch (error) {
    await client.chat.update({
      channel,
      ts: pending.ts as string,
      text: "Sorry, I couldn't build your brag doc just now. Tap the button again in a moment?",
    });
    throw error;
  }
};
