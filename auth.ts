// auth.ts
// Auth.js v5 configuration. Env vars AUTH_GITHUB_ID / AUTH_GITHUB_SECRET are
// auto-detected by next-auth based on the "github" provider id — no need to
// pass clientId/clientSecret manually.
//
// Also requires AUTH_SECRET in your env — generate one with:
//   npx auth secret
// or manually with:
//   openssl rand -base64 33
// Add it to .env.local and Vercel as AUTH_SECRET.

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    // Surface the GitHub username (login) on the session object — this is
    // what we'll later compare against commit authorship for contribution
    // attribution, and against repo ownership for the fork/originality check.
    async jwt({ token, profile }) {
      if (profile) {
        token.githubUsername = (profile as { login?: string }).login;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.githubUsername) {
        (session as { githubUsername?: string }).githubUsername =
          token.githubUsername as string;
      }
      return session;
    },
  },
});
