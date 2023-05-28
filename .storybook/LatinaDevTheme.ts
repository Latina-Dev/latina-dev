import { create } from "@storybook/theming/create";

export default create({
  // Base
  base: "light",

  // Typography
  fontBase:
    '"Latina Light", "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontCode:
    'ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace',

  // Brand
  brandTitle: "Latina Dev Storybook",
  brandUrl: "https://latina.dev",
  brandImage: "https://latina.dev/img/logos/storybook.png",
  brandTarget: "_self",

  // Colors
  colorPrimary: "#9e0001",
  colorSecondary: "#7d0000",

  // UI
  appBg: "#ffffff",
  appContentBg: "#ffffff",
  appBorderColor: "#151515",
  appBorderRadius: 8,

  // Text colors
  textColor: "#151515",
  textInverseColor: "#ffffff",

  // Toolbar default and active colors
  barTextColor: "#9E9E9E",
  barSelectedColor: "#585C6D",
  barBg: "#ffffff",

  // Form colors
  inputBg: "#ffffff",
  inputBorder: "#151515",
  inputTextColor: "#151515",
  inputBorderRadius: 8,
});
