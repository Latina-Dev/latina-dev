import type { Meta, StoryObj } from "@storybook/react";
import { exampleMember } from "@/types/members";

import SocialLinks from "./SocialLinks";

const meta: Meta<typeof SocialLinks> = {
  title: "SocialLinks",
  component: SocialLinks,
  tags: ["autodocs"]
};

export default meta;

type Story = StoryObj<typeof SocialLinks>;

export const Default: Story = {
  args: {
    member: {
      ...exampleMember
    }
  }
};
