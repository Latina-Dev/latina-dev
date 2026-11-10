import type { App } from "@slack/bolt";
import actions from "./actions";
import commands from "./commands";
import events from "./events";
import messages from "./messages";

const registerListeners = (app: App) => {
  actions.register(app);
  commands.register(app);
  events.register(app);
  messages.register(app);
};

export default registerListeners;
