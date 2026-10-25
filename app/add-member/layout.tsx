import JsonLd from "@/components/JsonLd/JsonLd";

import { breadcrumbJsonLd } from "@/lib/jsonLd";
import { pageMetadata } from "@/lib/pageMetadata";

import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Add Your Profile",
  description:
    "Join the Latina Dev directory of Latina software engineers. Sign in with LinkedIn to add your profile, and we'll add you to the directory and invite you to our Slack community.",
  path: "/add-member",
});

export default function AddMemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Add Your Profile", path: "/add-member" },
        ])}
      />
      {children}
    </>
  );
}
