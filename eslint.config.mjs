import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import storybook from "eslint-plugin-storybook";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...storybook.configs["flat/recommended"],
  {
    // eslint-plugin-react's "detect" calls an API removed in ESLint 10, so pin the version
    settings: { react: { version: "19" } },
  },
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    ignores: [".next/**", "out/**", "build/**", "storybook-static/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
