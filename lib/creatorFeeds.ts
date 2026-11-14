/**
 * Latina software engineers outside the directory whose new posts go to #creator-feed in Slack.
 * Members' own blogs (the `blog` field on their profile) go to #member-posts automatically, so a
 * creator who joins the directory moves there.
 *
 * Before adding someone:
 * - She is a Latina software engineer (or engineer-turned-educator or DevRel) who writes or makes
 *   videos about engineering. Check her own bio for both.
 * - The feed works and has posted in the last six months. The weekly Slack feeds check fails if a
 *   feed here is dead or stale, and so does a pull request that adds one.
 * - Describe her in her own words from her bio, and say where you checked.
 */

export interface CreatorFeed {
  name: string;
  /** One line on who she is, from her own bio */
  about: string;
  /** Where to read her work */
  site: string;
  /** RSS or Atom feed URL */
  feed: string;
}

// Empty until an organizer confirms each creator. Candidates are listed in docs/pages/slack.md.
export const creatorFeeds: CreatorFeed[] = [];
