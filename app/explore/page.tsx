"use client";

import { useEffect, useState } from "react";

interface Credential {
  id: string;
  walletAddress: string;
  issuedAt: string;
  repo: { name: string; githubUrl: string; stars: number; };
  analysis: {
    skills: string[];
    score: number;
    category: string;
    credentialTitle: string;
  };
}

const scoreColor = (s: number) =>
  s >= 80 ? "#a78bfa" : s >= 60 ? "#60a5fa" : s >= 40 ? "#00ff88" : "#f87171";

const mono = "JetBrains Mono, monospace";

export default function ExplorePage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/credentials?wallet=all")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCredentials(data.credentials);
        else setError("No credentials found yet.");
      })
      .catch(() => setError("Failed to load credentials."))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...new Set(credentials.map((c) => c.analysis.category))];
  const filtered = filter === "all" ? credentials : credentials.filter((c) => c.analysis.category === filter);

  return (
    <main style={{ minHeight: "100vh", background: "#000" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <nav style={{ borderBottom: "1px solid #1a1a1a", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)", zIndex: 50 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ color: "#00ff88", fontFamily: mono, fontWeight: 700, fontSize: 14, letterSpacing: "0.05em" }}>
            <span style={{ opacity: 0.4 }}>[</span>VERIXA<span style={{ opacity: 0.4 }}>]</span>
          </span>
        </a>
        <span style={{ fontSize: 9, color: "#333", fontFamily: mono, letterSpacing: "0.1em" }}>// EXPLORE</span>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 48px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 8 }}>// explore_credentials</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: mono, marginBottom: 4 }}>All verified builders</h1>
          <p style={{ fontSize: 11, color: "#444", fontFamily: mono }}>Browse credentials issued on Verixa</p>
        </div>

        {categories.length > 1 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                fontSize: 9, fontFamily: mono, padding: "4px 10px", borderRadius: 3,
                border: filter === cat ? "1px solid #00ff88" : "1px solid #1a1a1a",
                color: filter === cat ? "#00ff88" : "#444",
                background: filter === cat ? "#00ff8810" : "none",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ width: 20, height: 20, border: "2px solid #1a1a1a", borderTopColor: "#00ff88", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 11, color: "#444", fontFamily: mono }}>loading_credentials...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontSize: 11, color: "#444", fontFamily: mono, marginBottom: 16 }}>{error}</p>
            <a href="/" style={{ fontSize: 10, color: "#00ff88", fontFamily: mono, textDecoration: "none", border: "1px solid #00ff8830", borderRadius: 6, padding: "8px 16px" }}>
              submit_first_project()
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontSize: 11, color: "#444", fontFamily: mono }}>no credentials in this category yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, animation: "fadeIn 0.4s ease" }}>
            {filtered.map((c) => {
              const color = scoreColor(c.analysis.score);
              const date = new Date(c.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const shortWallet = `${c.walletAddress.slice(0, 6)}...${c.walletAddress.slice(-4)}`;
              return (
                <a key={c.id} href={`/verify/${c.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ border: "1px solid #1a1a1a", borderRadius: 8, padding: 14, display: "flex", alignItems: "flex-start", gap: 12, transition: "all 0.2s", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#00ff8840"; (e.currentTarget as HTMLDivElement).style.background = "#00ff8805"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <div style={{ width: 44, height: 44, flexShrink: 0, position: "relative" }}>
                      <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 44 44">
                        <circle cx="22" cy="22" r="17" fill="none" stroke="#111" strokeWidth="4" />
                        <circle cx="22" cy="22" r="17" fill="none" stroke={color} strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 17}
                          strokeDashoffset={2 * Math.PI * 17 - (c.analysis.score / 100) * 2 * Math.PI * 17}
                          strokeLinecap="round" />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: mono }}>{c.analysis.score}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: mono }}>{c.analysis.credentialTitle}</span>
                        <span style={{ fontSize: 9, color: "#333", fontFamily: mono, flexShrink: 0 }}>{date}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#444", fontFamily: mono, marginTop: 2 }}>
                        {c.repo.name} · <span style={{ color: "#333" }}>{shortWallet}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                        <span style={{ fontSize: 9, color: "#555", fontFamily: mono, border: "1px solid #1a1a1a", borderRadius: 3, padding: "1px 6px" }}>{c.analysis.category}</span>
                        {c.analysis.skills.slice(0, 3).map((skill) => (
                          <span key={skill} style={{ fontSize: 9, color: "#444", fontFamily: mono, border: "1px solid #1a1a1a", borderRadius: 3, padding: "1px 6px" }}>{skill}</span>
                        ))}
                        {c.analysis.skills.length > 3 && <span style={{ fontSize: 9, color: "#333", fontFamily: mono }}>+{c.analysis.skills.length - 3}</span>}
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
