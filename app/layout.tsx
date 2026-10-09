import { config } from "@fortawesome/fontawesome-svg-core";

import Footer from "@/components/Footer/Footer";
import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import Navbar from "@/components/Navbar/Navbar";

import type { Metadata } from "next";

import "@fortawesome/fontawesome-svg-core/styles.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { siteDescription, siteName, siteUrl } from "@/lib/site";

import styles from "./layout.module.css";

import "../styles/_styles.css";

config.autoAddCss = false;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: "Latina Dev — A Community for Latina Software Engineers",
    description: siteDescription,
    images: [{ url: "/img/featured-image.png", width: 1200, height: 630, alt: "Latina Dev" }],
  },
  icons: {
    shortcut: "/favicon.png",
  },
  manifest: "/manifest.json",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/img/logos/logo.png`,
  description: siteDescription,
  sameAs: [
    "https://github.com/Latina-Dev/latina-dev",
    "https://www.linkedin.com/company/latina-dev/",
    "https://latinadev.slack.com",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <div className={styles.wrapper}>
          <GitHubCorner />
          <Navbar />
          <main>
            <div className={styles.container}>
              {children}
              <Analytics />
              <SpeedInsights />
            </div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
