/**
 * The tools and platforms that keep Latina Dev running, shown on /built-with and in the README.
 *
 * `support` says how each one reaches us:
 * - "sponsored": the company gives us a paid plan for free (an open source program, a direct ask
 *   or a perk, like Slack Pro)
 * - "founder": Frances pays for it herself
 * - "free": we use the company's free plan, often one made for open source projects
 *
 * Never list prices or dollar amounts here.
 */
export type Support = "sponsored" | "founder" | "free";

export type Tool = {
  name: string;
  url: string;
  /** What Latina Dev uses it for, as a short sentence fragment */
  use: string;
  support: Support;
  /** The plan name, when it says something useful (e.g. "Pro") */
  plan?: string;
};

export const tools: Tool[] = [
  {
    name: "Vercel",
    url: "https://vercel.com",
    use: "hosts latina.dev, with analytics and speed insights",
    support: "sponsored",
    plan: "Pro",
  },
  {
    name: "Buffer",
    url: "https://buffer.com",
    use: "schedules posts for the Latina Dev LinkedIn page",
    support: "founder",
  },
  {
    name: "Claude",
    url: "https://claude.com/product/claude-code",
    use: "reviews every pull request and helps build new features",
    support: "founder",
  },
  {
    name: "latina.dev domain",
    url: "https://vercel.com/domains",
    use: "our home on the web, registered through Vercel",
    support: "founder",
  },
  {
    name: "Slack",
    url: "https://slack.com",
    use: "the members-only Latina Dev community",
    support: "sponsored",
    plan: "Pro",
  },
  {
    name: "Chromatic",
    url: "https://www.chromatic.com",
    use: "visual tests and the public Storybook for our design system",
    support: "free",
  },
  {
    name: "CodeRabbit",
    url: "https://www.coderabbit.ai",
    use: "AI code review on pull requests",
    support: "free",
  },
  {
    name: "Formspree",
    url: "https://formspree.io",
    use: "the add-your-profile form",
    support: "free",
  },
  {
    name: "GitHub",
    url: "https://github.com",
    use: "code, CI, security scanning and docs.latina.dev",
    support: "free",
  },
  {
    name: "Greptile",
    url: "https://www.greptile.com",
    use: "AI code review on pull requests",
    support: "free",
  },
  {
    name: "ImprovMX",
    url: "https://improvmx.com",
    use: "email for hola@latina.dev",
    support: "free",
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/latina-dev",
    use: "member sign-in and our company page",
    support: "free",
  },
  {
    name: "OpenSSF Scorecard",
    url: "https://scorecard.dev",
    use: "weekly security health checks",
    support: "free",
  },
  {
    name: "Sentry",
    url: "https://sentry.io",
    use: "error monitoring",
    support: "free",
  },
  {
    name: "Storybook",
    url: "https://storybook.js.org",
    use: "builds and documents our components",
    support: "free",
  },
];

export const supportGroups: { support: Support; title: string; blurb: string }[] = [
  {
    support: "sponsored",
    title: "Sponsored",
    blurb: "Companies that give Latina Dev a paid plan for free.",
  },
  {
    support: "founder",
    title: "Funded by our founder",
    blurb: "Paid for out of pocket by Frances Coronel, who started and runs Latina Dev.",
  },
  {
    support: "free",
    title: "Free plans we rely on",
    blurb: "Free and open source plans that cover what a volunteer project needs.",
  },
];

/** Tools in one group, A to Z */
export const toolsFor = (support: Support): Tool[] =>
  tools
    .filter((tool) => tool.support === support)
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
