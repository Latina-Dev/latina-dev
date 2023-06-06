import Footer from "@/components/Footer/Footer";
import GitHubCorner from "@/components/GitHubCorner/GitHubCorner";
import MetaTags from "@/components/Layout/MetaTags";
import Navbar from "@/components/Navbar/Navbar";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { Analytics } from "@vercel/analytics/react";
import styles from "./layout.module.css";
import "/styles/_styles.css";

export const metadata = {
  title: {
    default: "Latina Dev",
    template: "%s | Latina Dev",
  },
  description:
    "Latina Dev is an open-source directory of Latina software engineers at the student, IC, and leadership levels. Our goal is to increase visibility and access to valuable opportunities.",
  icons: {
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <MetaTags />
      <body>
        <div className={styles.wrapper}>
          <GitHubCorner />
          <Navbar />
          <main>
            <div className={styles.container}>
              {children} <Analytics />
            </div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
