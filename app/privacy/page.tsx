import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";

import type { Metadata } from "next";

import styles from "../guides/guides.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description:
    "What Latina Dev collects on latina.dev and through its MCP server, how it is used, and how to reach us.",
  path: "/privacy",
});

const updated = "2026-10-13";

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Privacy policy", path: "/privacy" },
        ])}
      />
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        lede={
          <p>
            Last updated <time dateTime={updated}>October 13, 2026</time>
          </p>
        }
      />
      <article className={`page-width ${styles.article}`}>
        <div className={styles.body}>
          <p>
            Latina Dev is an open-source directory of Latina software engineers. This page explains
            what we collect when you visit latina.dev or use the Latina Dev MCP server, and what we
            do with it. We don&apos;t sell personal data or use it for advertising.
          </p>

          <h2>Member profiles</h2>
          <p>
            Member profiles are public on purpose: they exist so Latina engineers get discovered. A
            profile holds what the member chose to share, such as their name, level, title,
            location, countries of heritage and links to LinkedIn, GitHub, X and a personal site.
            Profiles are stored in our public{" "}
            <a href="https://github.com/Latina-Dev/latina-dev">GitHub repository</a> and shown on
            the site, in the <a href="/members.json">members feed</a> and through the MCP server. To
            change or remove your profile, email{" "}
            <a href="mailto:hola@latina.dev">hola@latina.dev</a> or open a pull request.
          </p>

          <h2>Visiting latina.dev</h2>
          <ul>
            <li>
              <strong>Analytics:</strong> we use Vercel Web Analytics and Speed Insights to count
              page views and measure page speed. They don&apos;t use cookies and don&apos;t identify
              individual visitors.
            </li>
            <li>
              <strong>Error monitoring:</strong> we use Sentry to find and fix errors. When an error
              happens, and for a small sample of visits, Sentry records a replay of the page with
              all text masked and all images and media blocked. It also records performance traces
              of requests to our server, such as the address requested, how long it took and whether
              it failed. It doesn&apos;t record what was sent in a request.
            </li>
            <li>
              <strong>Forms:</strong> when you ask to join the directory, what you type in the form
              is sent to us through Formspree so we can review it.
            </li>
          </ul>

          <h2>The MCP server</h2>
          <p>
            The <a href="https://docs.latina.dev/#/pages/mcp-server">Latina Dev MCP server</a> at
            latina.dev/mcp lets AI assistants search the directory and resources. It is read-only
            and needs no account. It only returns information that is already public on latina.dev.
            We don&apos;t store the searches assistants send, don&apos;t send them to Sentry, and
            don&apos;t link them to any person. Like any website, our host (Vercel) keeps
            short-lived request logs, such as IP addresses and timestamps, to run and protect the
            service.
          </p>

          <h2>Sharing and retention</h2>
          <p>
            We share data only with the services named above, which process it on our behalf: Vercel
            (hosting and analytics), Sentry (error monitoring) and Formspree (forms). Each keeps
            data according to its own retention settings. Member profiles stay public until the
            member asks us to change or remove them.
          </p>

          <h2>Contact</h2>
          <p>
            Questions or requests about your data:{" "}
            <a href="mailto:hola@latina.dev">hola@latina.dev</a>.
          </p>
        </div>
      </article>
    </>
  );
}
