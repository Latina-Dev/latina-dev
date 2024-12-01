import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

import type { Meta, StoryObj } from "@storybook/react";

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
