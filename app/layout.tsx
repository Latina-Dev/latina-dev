import { config } from "@fortawesome/fontawesome-svg-core";

import Footer from "@/components/Footer/Footer";
import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import Navbar from "@/components/Navbar/Navbar";

import type { Metadata } from "next";

import "@fortawesome/fontawesome-svg-core/styles.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { defaultSocialImage } from "@/lib/pageMetadata";
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
    locale: "en_US",
    title: siteName,
    description: siteDescription,
    images: [defaultSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [defaultSocialImage],
  },
  icons: {
    shortcut: "/favicon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
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
