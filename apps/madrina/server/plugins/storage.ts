import upstashDriver from "unstorage/drivers/upstash";

/**
 * Where Madrina keeps the little state that has to outlive a serverless invocation:
 * who opted in to the weekly check-in and each person's last check-in thread.
 *
 * - Local dev: files under .data/madrina (see devStorage in nitro.config.ts).
 * - Production: Upstash Redis when its REST credentials are set. The Vercel Marketplace
 *   integration provides KV_REST_API_URL / KV_REST_API_TOKEN; Upstash's own names work too.
 * - Production without credentials: memory only, which is lost between invocations.
 */
export default defineNitroPlugin(() => {
  if (import.meta.dev) return;

  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[madrina] No Redis credentials (KV_REST_API_URL / KV_REST_API_TOKEN). Weekly check-in opt-ins are kept in memory only and will not survive a restart.",
    );
    return;
  }

  useStorage().mount("madrina", upstashDriver({ url, token, base: "madrina" }));
});
