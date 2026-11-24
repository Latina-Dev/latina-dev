import { App, LogLevel } from "@slack/bolt";
import { VercelReceiver } from "@vercel/slack-bolt";
import registerListeners from "./listeners";

const logLevel =
  process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO;

const receiver = new VercelReceiver({
  logLevel,
});

const app = new App({
  // SLACK_CLI_XOXB is injected by `slack run`; .env SLACK_BOT_TOKEN wins if set.
  token: process.env.SLACK_BOT_TOKEN ?? process.env.SLACK_CLI_XOXB,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver,
  deferInitialization: true,
  // Seed personas (Dana, Priya...) are posted by Madrina's own bot, so don't drop
  // our own bot messages; each listener skips the ones it shouldn't act on.
  ignoreSelf: false,
  logLevel,
});

registerListeners(app);

export { app, receiver };
