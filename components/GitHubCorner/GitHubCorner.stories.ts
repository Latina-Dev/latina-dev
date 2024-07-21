import type { Meta, StoryObj } from "@storybook/react";

import GitHubCorner from "./GitHubCorner";

const meta: Meta<typeof GitHubCorner> = {
  title: "GitHubCorner",
  component: GitHubCorner,
  tags: ["autodocs"]
};

export default meta;

type Story = StoryObj<typeof GitHubCorner>;

export const Default: Story = {
  args: {}
};
