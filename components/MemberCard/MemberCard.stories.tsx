import type { Meta, StoryObj } from "@storybook/react";
import { exampleMember } from "@/types/members";

import MemberCard from "./MemberCard";

const meta: Meta = {
  title: "MemberCard",
  component: MemberCard,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  args: {
    member: {
      ...exampleMember,
    },
  },
};
