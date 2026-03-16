import { addons } from "storybook/internal/manager-api";

import LatinaDevTheme from "./LatinaDevTheme";

addons.setConfig({
  theme: LatinaDevTheme,
});
