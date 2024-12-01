import type { Meta, StoryObj } from "@storybook/react";

import GitHubCorner from "./GitHubCorner";

const meta: Meta = {
  title: "GitHubCorner",
  component: GitHubCorner,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  args: {},
};
