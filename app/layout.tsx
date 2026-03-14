import type { Metadata } from "next";

import Footer from "@/components/Footer/Footer";
import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import Navbar from "@/components/Navbar/Navbar";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import styles from "./layout.module.css";

import "../styles/_styles.css";

const siteUrl = "https://latina.dev";
const siteDescription =
  "Latina Dev is an open-source directory of Latina software engineers at the student, IC, and leadership levels. Our goal is to increase visibility and access to valuable opportunities for Latina engineers across the tech industry.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Latina Dev",
    template: "%s | Latina Dev",
  },
  description: siteDescription,
  keywords: [
    "Latina software engineers",
    "Latina developers",
    "Latina tech community",
    "women in tech",
    "Latina engineers",
    "Hispanic women in STEM",
    "diversity in tech",
    "software engineering community",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Latina Dev",
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
  name: "Latina Dev",
  url: siteUrl,
  logo: `${siteUrl}/img/logos/latina-dev-logo.png`,
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
