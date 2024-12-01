import type { Meta, StoryObj } from "@storybook/react";

import Footer from "./Footer";

const meta: Meta = {
  title: "Footer",
  component: Footer,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  args: {},
};
