import type { App } from "@slack/bolt";

const register = (app: App) => {
  app.command("/madrina", async ({ ack, respond }) => {
    await ack();
    await respond({
      response_type: "ephemeral",
      text: "Hi, I'm Madrina :madrina: Open my *Home* tab for your dashboard, or DM me a question about your path to Staff.",
    });
  });
};

export default { register };
