import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: [
    {
      // 👇 Sets the directory containing your stories
      directory: "../docs",
      // 👇 Storybook will load all files that match this glob
      files: "**/*.mdx",
      // 👇 Used when generating automatic titles for your stories
      titlePrefix: "Docs",
    },
    {
      // 👇 Sets the directory containing your stories
      directory: "../components",
      // 👇 Storybook will load all files that match this glob
      files: "**/*.stories.@(js|jsx|ts|tsx)",
      // 👇 Used when generating automatic titles for your stories
      titlePrefix: "Components",
    },
  ],

  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-a11y",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-links",
    "@storybook/addon-storysource",
    "@storybook/addon-styling",
  ],

  framework: {
    name: "@storybook/nextjs",
    options: {},
  },

  staticDirs: ["../public"],

  docs: {},
};
export default config;
