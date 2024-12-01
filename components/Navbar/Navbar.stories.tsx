import type { Meta, StoryObj } from "@storybook/react";

import Navbar from "./Navbar";

const meta: Meta = {
  title: "Navbar",
  component: Navbar,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  args: {},
};
