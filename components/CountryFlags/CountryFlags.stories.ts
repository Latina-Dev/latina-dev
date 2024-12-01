import type { Meta, StoryObj } from "@storybook/react";

import CountryFlags from "./CountryFlags";

const meta: Meta = {
  title: "CountryFlags",
  component: CountryFlags,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj;

export const SingleCountry: Story = {
  args: {
    countries: ["Peru"],
  },
};

export const MultipleCountries: Story = {
  args: {
    countries: ["Peru", "Brazil", "Argentina"],
  },
};
