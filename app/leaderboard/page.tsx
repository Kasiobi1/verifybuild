"use client";

import { useEffect, useState } from "react";

interface LeaderboardEntry {
  walletAddress: string;
  totalCredentials: number;
  avgScore: number;
  topScore: number;
  topTitle: string;
  topCredentialId: string;
  skills: string[];
  topCategory: string;
}

const mono = "JetBrains Mono, monospace";

const scoreColor = (s: number) =>
  s >= 80 ? "#a78bfa" : s >= 60 ? "#60a5fa" : s >= 40 ? "#00ff88" : "#f87171";

const rankStyle = (rank: number) => {
  if (rank === 1) return { color: "#fbbf24", label: "01", glow: "#fbbf24" };
  if (rank === 2) return { color: "#94a3b8", label: "02", glow: "#94a3b8" };
  if (rank === 3) return { color: "#cd7c2f", label: "03", glow: "#cd7c2f" };
  return { color: "#333", label: rank.toString().padStart(2, "0"), glow: "transparent" };
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<"avgScore" | "topScore" | "totalCredentials">("avgScore");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEntries(data.leaderboard);
        else setError("Failed to load leaderboard.");
      })
      .catch(() => setError("Failed to load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...entries].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <main style={{ minHeight: "100vh", background: "#000" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #1a1a1a", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)", zIndex: 50 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ color: "#00ff88", fontFamily: mono, fontWeight: 700, fontSize: 14, letterSpacing: "0.05em" }}>
            <span style={{ opacity: 0.4 }}>[</span>VERIXA<span style={{ opacity: 0.4 }}>]</span>
          </span>
        </a>
        <span style={{ fontSize: 9, color: "#333", fontFamily: mono, letterSpacing: "0.1em" }}>// LEADERBOARD</span>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 8 }}>
            // top_builders
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: mono, marginBottom: 4 }}>
            Builder Leaderboard
          </h1>
          <p style={{ fontSize: 11, color: "#444", fontFamily: mono }}>
            Ranked by verified skill scores on Verixa
          </p>
        </div>

        {/* Sort controls */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { key: "avgScore", label: "avg_score" },
            { key: "topScore", label: "top_score" },
            { key: "totalCredentials", label: "credentials" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key as typeof sortBy)}
              style={{
                fontSize: 9, fontFamily: mono, padding: "4px 12px", borderRadius: 3,
                border: sortBy === s.key ? "1px solid #00ff88" : "1px solid #1a1a1a",
                color: sortBy === s.key ? "#00ff88" : "#444",
                background: sortBy === s.key ? "#00ff8810" : "none",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              sort_by({s.label})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ width: 20, height: 20, border: "2px solid #1a1a1a", borderTopColor: "#00ff88", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 11, color: "#444", fontFamily: mono }}>loading_leaderboard...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontSize: 11, color: "#f87171", fontFamily: mono }}>{error}</p>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontSize: 11, color: "#444", fontFamily: mono, marginBottom: 16 }}>no builders yet.</p>
            <a href="/" style={{ fontSize: 10, color: "#00ff88", fontFamily: mono, textDecoration: "none", border: "1px solid #00ff8830", borderRadius: 6, padding: "8px 16px" }}>
              be_the_first()
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, animation: "fadeIn 0.4s ease" }}>

            {/* Top 3 podium */}
            {sorted.length >= 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 16 }}>
                {[sorted[1], sorted[0], sorted[2]].map((entry, i) => {
                  const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                  const r = rankStyle(actualRank);
                  const shortWallet = `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`;
                  const height = actualRank === 1 ? 120 : actualRank === 2 ? 96 : 80;
                  return (
                    <a key={entry.walletAddress} href={`/profile/${entry.walletAddress}`} style={{ textDecoration: "none" }}>
                      <div style={{
                        border: `1px solid ${r.color}40`,
                        borderRadius: 8,
                        padding: 12,
                        textAlign: "center",
                        background: `${r.color}08`,
                        height,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        transition: "all 0.2s",
                        cursor: "pointer",
                      }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = `${r.color}15`; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = `${r.color}08`; }}
                      >
                        <div style={{ fontSize: actualRank === 1 ? 20 : 14, filter: `drop-shadow(0 0 6px ${r.color})` }}>
                          {actualRank === 1 ? "👑" : actualRank === 2 ? "🥈" : "🥉"}
                        </div>
                        <div style={{ fontSize: actualRank === 1 ? 20 : 16, fontWeight: 700, color: r.color, fontFamily: mono }}>
                          {entry[sortBy]}
                        </div>
                        <div style={{ fontSize: 8, color: "#555", fontFamily: mono }}>{sortBy.replace(/([A-Z])/g, '_$1').toLowerCase()}</div>
                        <div style={{ fontSize: 9, color: "#444", fontFamily: mono }}>{shortWallet}</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            {sorted.map((entry, index) => {
              const rank = index + 1;
              const r = rankStyle(rank);
              const shortWallet = `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`;
              const color = scoreColor(entry.avgScore);

              return (
                <a key={entry.walletAddress} href={`/profile/${entry.walletAddress}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      border: rank <= 3 ? `1px solid ${r.color}30` : "1px solid #1a1a1a",
                      borderRadius: 8, padding: 14,
                      display: "flex", alignItems: "center", gap: 12,
                      transition: "all 0.2s", cursor: "pointer",
                      background: rank <= 3 ? `${r.color}05` : "transparent",
                      animation: `slideIn 0.3s ease ${index * 0.05}s both`,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#00ff8840"; (e.currentTarget as HTMLDivElement).style.background = "#00ff8805"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = rank <= 3 ? `${r.color}30` : "#1a1a1a"; (e.currentTarget as HTMLDivElement).style.background = rank <= 3 ? `${r.color}05` : "transparent"; }}
                  >
                    {/* Rank */}
                    <div style={{ width: 28, textAlign: "center", flexShrink: 0 }}>
                      <span style={{
                        fontSize: rank <= 3 ? 14 : 11, fontWeight: 700,
                        color: r.color, fontFamily: mono,
                        filter: rank <= 3 ? `drop-shadow(0 0 4px ${r.glow})` : "none",
                      }}>
                        {r.label}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      border: `1px solid ${rank <= 3 ? r.color + "40" : "#1a1a1a"}`,
                      background: "#0a0a0a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: rank <= 3 ? r.color : "#444",
                      fontFamily: mono,
                    }}>
                      {shortWallet.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: mono }}>{shortWallet}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: mono }}>
                            {entry[sortBy]}
                            <span style={{ fontSize: 8, color: "#444", marginLeft: 2 }}>
                              {sortBy === "totalCredentials" ? " creds" : "/100"}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "#444", fontFamily: mono, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.topTitle}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                        <span style={{ fontSize: 9, color: "#555", fontFamily: mono, border: "1px solid #1a1a1a", borderRadius: 3, padding: "1px 6px" }}>
                          {entry.topCategory}
                        </span>
                        {entry.skills.slice(0, 2).map((s) => (
                          <span key={s} style={{ fontSize: 9, color: "#444", fontFamily: mono, border: "1px solid #1a1a1a", borderRadius: 3, padding: "1px 6px" }}>{s}</span>
                        ))}
                        <span style={{ fontSize: 9, color: "#333", fontFamily: mono }}>
                          {entry.totalCredentials} credential{entry.totalCredentials !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <span style={{ color: "#333", fontFamily: mono, fontSize: 12, flexShrink: 0 }}>→</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
