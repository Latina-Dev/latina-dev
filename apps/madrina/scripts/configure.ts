// This is a WIP script to configure the Slack app for local development.

import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import input from "@inquirer/input";
import boxen from "boxen";
import chalk from "chalk";
import ora from "ora";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  primary: chalk.hex("#0070f3"),
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  muted: chalk.gray,
  highlight: chalk.magenta,
};

type SlackCreateAppResponse = {
  ok?: boolean;
  app_id?: string;
  error?: string;
  errors?: Array<{ message?: string; pointer?: string }>;
  credentials?: { signing_secret?: string };
};

async function main(): Promise<void> {
  console.warn(
    "\x1b[33m\x1b[3m%s\x1b[0m",
    "⚠  This script is a work in progress and may not work as expected.",
  );
  try {
    const configToken = await getAppConfigToken();
    const result = await createAppFromManifest(configToken);
    const appId = result.app_id;
    await linkApp(appId);
    await ensureSigningSecret(result);
    await configureAIGateway();
    await setManifestSourceLocal();
    await ensureNgrokToken();
    await startTunnel();

    console.log(
      boxen(
        `${colors.success("🎉 Setup Complete!")}\n\n` +
          `Your Slack app is now configured and ready for development.\n` +
          `The development tunnel is starting...`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
        },
      ),
    );

    process.exitCode = 0;
  } catch (err: any) {
    handleError(err);
    process.exitCode = 1;
  }
}

main();

async function getAppConfigToken(): Promise<string> {
  console.log(
    `\n${colors.primary("📋 Step 1:")} ${colors.highlight("Setup your Slack App")}`,
  );
  console.log(
    colors.muted("Generate an App Configuration Token in Slack to continue.\n"),
  );

  const appConfigToken = await promptValueOrOpen(
    "SLACK_APP_CONFIG_TOKEN",
    "Press ENTER to create token or paste your token here:",
    "https://api.slack.com/apps",
  );

  addToEnv("SLACK_APP_CONFIG_TOKEN", appConfigToken);

  return appConfigToken;
}

async function createAppFromManifest(
  configToken: string,
): Promise<SlackCreateAppResponse> {
  const spinner = ora({
    text: "Reading local manifest.json...",
    color: "blue",
  }).start();

  try {
    const manifest = await readManifestFile();
    spinner.text = "Creating Slack app from manifest...";

    const result: SlackCreateAppResponse = await createSlackAppFromManifest(
      configToken,
      manifest,
    );

    if (!result?.ok) {
      spinner.fail("Failed to create Slack app");
      const error: any = new Error(
        result?.error ? result.error : "Failed to create app",
      );
      (error as any).response = result;
      throw error;
    }

    spinner.succeed("Slack app created successfully!");

    if (result.app_id) {
      console.log(
        `${colors.success("✓")} App ID: ${colors.highlight(result.app_id)}`,
      );
    }

    return result;
  } catch (error) {
    spinner.fail("Failed to create app from manifest");
    throw error;
  }
}

async function linkApp(appId?: string): Promise<void> {
  if (!appId) {
    console.log(colors.error("❌ No app ID available for linking"));
    console.log(
      colors.muted(
        `Run manually: slack app link --team <your_team_id> --app ${appId} --environment local`,
      ),
    );
    return;
  }

  const spinner = ora({
    text: `Linking app ${appId} to local environment...`,
    color: "blue",
  }).start();

  const linked = linkSlackApp(appId);

  if (linked) {
    spinner.succeed("App linked successfully!");
  } else {
    spinner.fail("Failed to link app automatically");
    console.log(colors.warning("⚠️  Please run manually:"));
    console.log(colors.muted(`   slack app link`));
  }
}

async function ensureSigningSecret(
  result: SlackCreateAppResponse,
): Promise<void> {
  const signingSecret = result?.credentials?.signing_secret;
  if (signingSecret) {
    const spinner = ora("Adding signing secret to .env...").start();
    addToEnv("SLACK_SIGNING_SECRET", signingSecret);
    spinner.succeed("Signing secret added to .env!");
    return;
  }

  const appId = result?.app_id;
  const value = await promptValueOrOpen(
    "SLACK_SIGNING_SECRET",
    "Press ENTER to open app settings or paste your signing secret here:",
    appId
      ? `https://api.slack.com/apps/${appId}`
      : "https://api.slack.com/apps",
  );

  const spinner = ora("Adding signing secret to environment...").start();
  addToEnv("SLACK_SIGNING_SECRET", value);
  spinner.succeed("Signing secret added to .env!");
}

async function configureAIGateway(): Promise<void> {
  console.log(
    `\n${colors.primary("🤖 Step 2:")} ${colors.highlight("Setup the Vercel AI Gateway")}`,
  );
  console.log(
    colors.muted(
      "Configure your AI Gateway API key for enhanced functionality.\n",
    ),
  );

  const token = await promptValueOrOpen(
    "AI_GATEWAY_API_KEY",
    "Press ENTER to create an API key or paste your API key here:",
    "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys%3Futm_source%3Dai_gateway_landing_page&title=Get+an+API+Key",
  );

  const spinner = ora("Adding AI Gateway key to environment...").start();
  addToEnv("AI_GATEWAY_API_KEY", token);
  spinner.succeed("AI Gateway configured!");
}

/** Without an ngrok token the tunnel step falls back to plain `pnpm dev` and Slack can't reach it. */
async function ensureNgrokToken(): Promise<void> {
  if (process.env.NGROK_AUTH_TOKEN || envFileHas("NGROK_AUTH_TOKEN")) return;

  console.log(
    `\n${colors.primary("🚇 Step 3:")} ${colors.highlight("Setup the local tunnel")}`,
  );
  const token = await promptValueOrOpen(
    "NGROK_AUTH_TOKEN",
    "Press ENTER to open the ngrok dashboard or paste your authtoken here:",
    "https://dashboard.ngrok.com/get-started/your-authtoken",
  );

  const spinner = ora("Adding ngrok token to .env...").start();
  addToEnv("NGROK_AUTH_TOKEN", token);
  spinner.succeed("ngrok token added to .env!");
}

async function startTunnel(): Promise<ChildProcess> {
  const spinner = ora({
    text: "Initializing development tunnel...",
    color: "cyan",
  }).start();

  await new Promise((resolve) => setTimeout(resolve, 2000));

  spinner.succeed("Development tunnel starting...");
  console.log(
    colors.muted("The tunnel will continue running in the foreground.\n"),
  );

  const tunnelProcess = spawn("pnpm", ["dev:tunnel"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  tunnelProcess.on("exit", (code) => {
    process.exitCode = code ?? 0;
  });

  return tunnelProcess;
}

async function setManifestSourceLocal(): Promise<void> {
  const spinner = ora("Updating manifest configuration...").start();

  try {
    const configPath = path.join(__dirname, "..", ".slack", "config.json");
    if (!fs.existsSync(configPath)) {
      spinner.succeed("No config file to update");
      return;
    }

    const raw = fs.readFileSync(configPath, "utf8");
    const json: any = JSON.parse(raw || "{}");
    if (!json.manifest) json.manifest = {};
    json.manifest.source = "local";
    fs.writeFileSync(configPath, `${JSON.stringify(json, null, 2)}\n`, "utf8");

    spinner.succeed("Manifest configuration updated");
  } catch (e: any) {
    spinner.fail("Failed to update manifest configuration");
    console.log(colors.error(`Error: ${e?.message ? e.message : String(e)}`));
  }
}

async function promptValueOrOpen(
  label: string,
  tip: string,
  url: string,
  validate?: string | ((value: string) => boolean),
): Promise<string> {
  while (true) {
    const value = await input({
      message: `${colors.highlight(label)}: ${colors.muted(tip)}`,
    });
    const trimmed = String(value ?? "").trim();

    if (trimmed.length > 0) {
      if (typeof validate === "string") {
        if (trimmed.startsWith(validate)) return trimmed;
      } else if (typeof validate === "function") {
        if (validate(trimmed)) return trimmed;
      } else {
        return trimmed;
      }
      console.log(colors.error(`❌ Invalid ${label}. Please try again.\n`));
      continue;
    }

    const spinner = ora(`Opening ${label.toLowerCase()} page...`).start();
    const opened = openUrl(url);

    if (opened) {
      spinner.stop();
    } else {
      spinner.fail("Could not open browser automatically");
      console.log(colors.info(`Please open: ${colors.muted(url)}`));
    }

    const requiredValue = await input({
      message: `${colors.highlight(label)}:`,
      validate: (val: string) => {
        const t = String(val ?? "").trim();
        if (t.length === 0)
          return `${label} cannot be empty. Please try again.`;
        if (typeof validate === "string" && !t.startsWith(validate))
          return `Invalid ${label}. Please try again.`;
        if (typeof validate === "function" && !validate(t))
          return `Invalid ${label}. Please try again.`;
        return true;
      },
    });
    return String(requiredValue).trim();
  }
}

function openUrl(rawUrl: string): boolean {
  try {
    // Only ever hand a parsed http(s) URL to the OS, never raw input.
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
      return false;
    const url = parsed.href;
    if (process.platform === "darwin") {
      const p = spawn("open", [url], { stdio: "ignore", detached: true });
      p.unref();
      return true;
    }
    if (process.platform === "win32") {
      // explorer.exe opens the default browser without going through a shell.
      const p = spawn("explorer.exe", [url], {
        stdio: "ignore",
        detached: true,
      });
      p.unref();
      return true;
    }
    const p = spawn("xdg-open", [url], { stdio: "ignore", detached: true });
    p.unref();
    return true;
  } catch {
    return false;
  }
}

async function readManifestFile(): Promise<any> {
  const manifestPath = path.join(__dirname, "..", "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.json not found at ${manifestPath}`);
  }
  const content = fs.readFileSync(manifestPath, "utf8");
  const parsed = JSON.parse(content);
  return parsed;
}

async function createSlackAppFromManifest(
  token: string,
  manifest: any,
): Promise<SlackCreateAppResponse> {
  const params = new URLSearchParams();
  params.set("manifest", JSON.stringify(manifest));
  const res = await fetch("https://slack.com/api/apps.manifest.create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as SlackCreateAppResponse;
  return data;
}

function linkSlackApp(appId: string): boolean {
  try {
    const args = ["app", "link", "--app", appId, "--environment", "local"];
    const r = spawnSync("slack", args, { stdio: "inherit" });
    return r.status === 0;
  } catch {
    return false;
  }
}

function envFileHas(key: string): boolean {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return false;
  return fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .some((line) => new RegExp(`^${key}=["']?[^"'\\s]`).test(line));
}

function addToEnv(key: string, value: string): void {
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }
  const lines = envContent
    .split("\n")
    .filter((line) => line && !line.startsWith(`${key}=`));
  let next = lines.join("\n");
  if (next && !next.endsWith("\n")) next += "\n";
  next += `${key}="${value}"\n`;
  fs.writeFileSync(envPath, next, "utf8");
}

function handleError(err: any): void {
  console.log("\n");
  const message = err?.message ? err.message : String(err);

  console.log(
    boxen(
      `${colors.error("❌ Configuration Failed")}\n\n` +
        `${colors.muted("Error:")} ${message}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "red",
      },
    ),
  );

  const resp: SlackCreateAppResponse | undefined = err?.response
    ? (err.response as SlackCreateAppResponse)
    : undefined;
  handleSlackApiError(resp);
}

function handleSlackApiError(resp?: SlackCreateAppResponse): void {
  if (!resp) return;

  const baseError = resp.error ? resp.error : "unknown_error";
  console.log(
    `\n${colors.error("Slack API Error:")} ${colors.highlight(baseError)}`,
  );

  if (Array.isArray(resp.errors) && resp.errors.length > 0) {
    console.log(colors.muted("\nDetails:"));
    for (const e of resp.errors) {
      const msg = e?.message ? e.message : String(e);
      const ptr = e?.pointer ? e.pointer : "";
      if (ptr) {
        console.log(
          `${colors.error("  •")} ${msg} ${colors.muted(`(${ptr})`)}`,
        );
      } else {
        console.log(`${colors.error("  •")} ${msg}`);
      }
    }
  }
}
