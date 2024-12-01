import type { Meta, StoryObj } from "@storybook/react";

import Logo from "./Logo";

const meta: Meta = {
  title: "Logo",
  component: Logo,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  args: {},
};
