import type { Meta, StoryObj } from "@storybook/react";
import { exampleMember } from "@/types/members";

import SocialLinks from "./SocialLinks";

const meta: Meta = {
  title: "SocialLinks",
  component: SocialLinks,
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
