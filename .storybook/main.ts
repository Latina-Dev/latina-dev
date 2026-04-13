import type { StorybookConfig } from "@storybook/nextjs";
import type { RuleSetRule } from "webpack";

const SWC_LOADER_PATTERNS = ["next-swc-loader", "swc-loader", "@swc/loader"];

function isSwcLoader(loader: unknown): boolean {
  return (
    typeof loader === "string" && SWC_LOADER_PATTERNS.some((p) => loader.includes(p))
  );
}

function hasSwcLoader(use: unknown): boolean {
  if (typeof use === "string") return isSwcLoader(use);
  if (typeof use === "object" && use !== null && "loader" in use)
    return isSwcLoader((use as { loader: unknown }).loader);
  if (Array.isArray(use))
    return (use as unknown[]).some(hasSwcLoader);
  return false;
}

function filterSwcFromRule(rule: RuleSetRule): RuleSetRule | null {
  if (!rule || typeof rule !== "object") return rule;

  // Direct loader property
  if ("loader" in rule && isSwcLoader(rule.loader)) return null;

  // use: single object or array
  if ("use" in rule) {
    const use = (rule as { use: unknown }).use;
    if (hasSwcLoader(use)) return null; // drop entire rule
  }

  // oneOf array
  if (Array.isArray((rule as { oneOf?: RuleSetRule[] }).oneOf)) {
    const oneOf = ((rule as { oneOf: RuleSetRule[] }).oneOf)
      .map(filterSwcFromRule)
      .filter(Boolean) as RuleSetRule[];
    return { ...rule, oneOf };
  }

  return rule;
}

const config: StorybookConfig = {
  stories: [
    {
      directory: "../docs",
      files: "**/*.mdx",
      titlePrefix: "Docs",
    },
    {
      directory: "../components",
      files: "**/*.stories.@(js|jsx|ts|tsx)",
      titlePrefix: "Components",
    },
  ],

  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-a11y",
    "@storybook/addon-links",
  ],

  framework: {
    name: "@storybook/nextjs",
    options: {},
  },

  staticDirs: ["../public"],

  docs: {},

  webpackFinal: async (config) => {
    // Remove @storybook/nextjs's SWC loader — it calls swc.isWasm() which was
    // removed in Next.js 16. Replace with babel-loader for TS/TSX compilation.
    if (config.module?.rules) {
      config.module.rules = (config.module.rules as RuleSetRule[])
        .map(filterSwcFromRule)
        .filter(Boolean) as RuleSetRule[];
    }

    // Add babel-loader as TS/TSX replacement for the removed SWC loader
    config.module = config.module ?? { rules: [] };
    config.module.rules = config.module.rules ?? [];
    (config.module.rules as RuleSetRule[]).push({
      test: /\.((c|m)?(j|t)sx?)$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
        options: {
          presets: [
            ["@babel/preset-env", { targets: { browsers: "last 2 versions" } }],
            ["@babel/preset-react", { runtime: "automatic" }],
            "@babel/preset-typescript",
          ],
        },
      },
    });

    return config;
  },
};
export default config;
