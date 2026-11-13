import { createHandler } from "@vercel/slack-bolt";
import { app, receiver } from "~/app";

const handler = createHandler(app, receiver);

export default defineEventHandler(async (event) => {
  // In v3 of Nitro, we will be able to use the request object directly
  const request = toWebRequest(event);
  return await handler(request);
});
