import type { Meta, StoryObj } from "@storybook/react";

import CountryFlags from "./CountryFlags";

const meta: Meta<typeof CountryFlags> = {
  title: "CountryFlags",
  component: CountryFlags,
  tags: ["autodocs"]
};

export default meta;

type Story = StoryObj<typeof CountryFlags>;

export const SingleCountry: Story = {
  args: {
    countries: ["Peru"]
  }
};

export const MultipleCountries: Story = {
  args: {
    countries: ["Peru", "Brazil", "Argentina"]
  }
};
