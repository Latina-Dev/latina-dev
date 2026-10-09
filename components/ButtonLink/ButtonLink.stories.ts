import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

import type { Meta, StoryObj } from "@storybook/nextjs";

import ButtonLink from "./ButtonLink";

const meta: Meta = {
  title: "ButtonLink",
  component: ButtonLink,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj;

export const ViewAllMembers: Story = {
  args: {
    text: "View all members",
    url: "/members",
    icon: faMagnifyingGlass,
  },
};

export const Outline: Story = {
  args: {
    text: "Request a Slack invite",
    url: "/add-member",
    variant: "outline",
  },
};

export const Light: Story = {
  args: {
    text: "Add your profile",
    url: "/add-member",
    variant: "light",
  },
  parameters: {
    backgrounds: { default: "brand", values: [{ name: "brand", value: "#9e0001" }] },
  },
};
