"use client";

import { useSession, signIn, signOut } from "next-auth/react";

const mono = "JetBrains Mono, monospace";

export default function GitHubConnect() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const username = (session as { githubUsername?: string } | null)?.githubUsername;

  if (isLoading) {
    return (
      <span style={{ fontSize: 10, color: "#444", fontFamily: mono }}>
        checking_github...
      </span>
    );
  }

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none",
          border: "1px solid #00ff8840",
          borderRadius: 4, padding: "4px 10px",
          fontSize: 10, color: "#00ff88",
          fontFamily: mono,
          cursor: "pointer",
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ff88", display: "inline-block" }} />
        @{username ?? session.user?.name ?? "github"}
        <span style={{ color: "#333", fontSize: 9 }}>[x]</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("github")}
      style={{
        background: "none",
        border: "1px solid #1a1a1a",
        borderRadius: 4, padding: "4px 10px",
        fontSize: 10, color: "#555",
        fontFamily: mono,
        cursor: "pointer",
      }}
    >
      connect_github()
    </button>
  );
}
