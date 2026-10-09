import type { Metadata } from "next";

// The page itself is a client component, so its metadata lives here
export const metadata: Metadata = {
  title: "Add Your Profile",
  description:
    "Join the Latina Dev directory of Latina software engineers. Submit your profile and we'll add you to the directory and invite you to our Slack community.",
  alternates: { canonical: "/add-member" },
};

export default function AddMemberLayout({ children }: { children: React.ReactNode }) {
  return children;
}
