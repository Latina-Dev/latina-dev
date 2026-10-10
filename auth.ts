import NextAuth from "next-auth";
import LinkedIn from "next-auth/providers/linkedin";

import { ownerHash } from "@/lib/profiles/owners";

// Members sign in with LinkedIn only. Sessions live in an encrypted cookie, so there's no
// database: what a member may edit is looked up from data/owners by their owner hash.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [LinkedIn],
  pages: { signIn: "/profile", error: "/profile" },
  callbacks: {
    jwt({ token, account }) {
      // account is only present on the sign-in request itself
      if (account?.provider === "linkedin") token.ownerHash = ownerHash(account.providerAccountId);
      return token;
    },
    session({ session, token }) {
      session.ownerHash = typeof token.ownerHash === "string" ? token.ownerHash : undefined;
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    ownerHash?: string;
  }
}
