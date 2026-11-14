import JsonLd from "@/components/JsonLd/JsonLd";
import PageHero from "@/components/PageHero/PageHero";

import { supportGroups, toolsFor } from "@/lib/builtWith";
import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";

import type { Metadata } from "next";

import articleStyles from "../guides/guides.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Built with",
  description:
    "The tools, sponsors and free open source plans that keep Latina Dev running, and how to help.",
  path: "/built-with",
});

export default function BuiltWithPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Built with", path: "/built-with" },
        ])}
      />
      <PageHero
        eyebrow="Open source"
        title="Built with"
        lede={
          <p>
            Latina Dev is free for everyone and run by volunteers. These are the companies and tools
            that keep it running, and who pays for each one.
          </p>
        }
      />
      <article className={`page-width ${articleStyles.article}`}>
        {supportGroups.map((group) => (
          <section key={group.support} className={styles.group} aria-labelledby={group.support}>
            <h2 id={group.support}>{group.title}</h2>
            <p className={styles.blurb}>{group.blurb}</p>
            <ul className={styles.grid}>
              {toolsFor(group.support).map((tool) => (
                <li key={tool.name} className={styles.card}>
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    {tool.name}
                    {tool.plan ? <span className={styles.plan}> {tool.plan}</span> : null}
                  </a>
                  <p>{tool.use}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className={styles.group} aria-labelledby="help">
          <h2 id="help">Help keep Latina Dev free</h2>
          <div className={articleStyles.body}>
            <p>
              <a href="https://github.com/Latina-Dev/latina-dev">Starring the repo</a> helps us
              qualify for more open source programs, which turn paid tools into free ones. You can
              also chip in through{" "}
              <a href="https://github.com/sponsors/francescoronel">GitHub Sponsors</a> or{" "}
              <a href="https://ko-fi.com/francescoronel">Ko-fi</a>.
            </p>
            <p>
              Run a developer tool with an open source program? Email{" "}
              <a href="mailto:hola@latina.dev">hola@latina.dev</a>.
            </p>
          </div>
        </section>
      </article>
    </>
  );
}
