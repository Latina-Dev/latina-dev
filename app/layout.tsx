import Head from "@/app/head";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "/styles/_styles.css";
config.autoAddCss = false;

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
      <Head />
      <body>{children}</body>
    </html>
  );
}
