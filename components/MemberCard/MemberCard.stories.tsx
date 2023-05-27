import { exampleMember } from "@/types/members";
import type { Meta, StoryObj } from "@storybook/react";

import MemberCard from "./MemberCard";

const meta: Meta<typeof MemberCard> = {
  title: "MemberCard",
  component: MemberCard,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof MemberCard>;

export const Default: Story = {
  args: {
    member: {
      ...exampleMember,
    },
  },
};
