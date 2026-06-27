"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Credential {
  id: string;
  walletAddress: string;
  issuedAt: string;
  repo: { name: string; githubUrl: string; stars: number; };
  analysis: {
    skills: string[]; levels: Record<string, string>;
    score: number; category: string; summary: string; credentialTitle: string;
  };
}

const scoreColor = (s: number) =>
  s >= 80 ? "#a78bfa" : s >= 60 ? "#60a5fa" : s >= 40 ? "#00ff88" : "#f87171";

export default function ProfilePage() {
  const { wallet } = useParams();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!wallet) return;
    fetch(`/api/credentials?wallet=${wallet}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setCredentials(data.credentials); else setError("No credentials found."); })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [wallet]);

  const shortWallet = typeof wallet === "string" ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "";
  const avgScore = credentials.length ? Math.round(credentials.reduce((a, c) => a + c.analysis.score, 0) / credentials.length) : 0;
  const allSkills = [...new Set(credentials.flatMap((c) => c.analysis.skills))];
  const topCategory = credentials.length
    ? Object.entries(credentials.reduce((acc, c) => { acc[c.analysis.category] = (acc[c.analysis.category] || 0) + 1; return acc; }, {} as Record<string, number>))
        .sort(([, a], [, b]) => b - a)[0]?.[0] : null;

  const mono = "JetBrains Mono, monospace";

  return (
    <main style={{ minHeight: "100vh", background: "#000" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #1a1a1a", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)", zIndex: 50 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ color: "#00ff88", fontFamily: mono, fontWeight: 700, fontSize: 14, letterSpacing: "0.05em" }}>
            <span style={{ opacity: 0.4 }}>[</span>VERIXA<span style={{ opacity: 0.4 }}>]</span>
          </span>
        </a>
        <span style={{ fontSize: 9, color: "#333", fontFamily: mono, letterSpacing: "0.1em" }}>// BUILDER PROFILE</span>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 48px" }}>

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ width: 20, height: 20, border: "2px solid #1a1a1a", borderTopColor: "#00ff88", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 11, color: "#444", fontFamily: mono }}>loading_profile...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <p style={{ fontSize: 11, color: "#f87171", fontFamily: mono, marginBottom: 12 }}>error: {error}</p>
            <a href="/" style={{ fontSize: 10, color: "#444", fontFamily: mono, textDecoration: "none" }}>← submit your first project</a>
          </div>
        ) : (
          <div style={{ animation: "fadeIn 0.4s ease" }}>

            {/* Profile header */}
            <div style={{ border: "1px solid #00ff8830", borderRadius: 10, padding: 20, marginBottom: 8, background: "#00ff8805" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  border: "1px solid #00ff8830", background: "#0a0a0a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: "#00ff88", fontFamily: mono,
                }}>
                  {shortWallet.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: mono }}>{shortWallet}</div>
                  <div style={{ fontSize: 9, color: "#444", fontFamily: mono, marginTop: 2, wordBreak: "break-all" }}>{wallet}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
                {[
                  { val: credentials.length, lbl: "credentials" },
                  { val: avgScore, lbl: "avg_score" },
                  { val: allSkills.length, lbl: "skills" },
                ].map((s) => (
                  <div key={s.lbl} style={{ background: "#000", border: "1px solid #1a1a1a", borderRadius: 6, padding: "12px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#00ff88", fontFamily: mono }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: "#444", fontFamily: mono, marginTop: 2 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Skills */}
              {allSkills.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 8 }}>// top_skills</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {allSkills.slice(0, 8).map((skill) => (
                      <span key={skill} style={{ fontSize: 9, color: "#555", fontFamily: mono, border: "1px solid #1a1a1a", borderRadius: 3, padding: "2px 7px" }}>
                        {skill}
                      </span>
                    ))}
                    {allSkills.length > 8 && <span style={{ fontSize: 9, color: "#333", fontFamily: mono, padding: "2px 0" }}>+{allSkills.length - 8} more</span>}
                  </div>
                </div>
              )}

              {topCategory && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, color: "#444", fontFamily: mono }}>specializes_in:</span>
                  <span style={{ fontSize: 9, color: "#00ff88", fontFamily: mono, border: "1px solid #00ff8830", borderRadius: 3, padding: "2px 8px" }}>
                    {topCategory}
                  </span>
                </div>
              )}
            </div>

            {/* Credentials list */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 12 }}>
                // verified_credentials ({credentials.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {credentials.map((c) => {
                  const color = scoreColor(c.analysis.score);
                  const date = new Date(c.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  return (
                    <a key={c.id} href={`/verify/${c.id}`} style={{ textDecoration: "none" }}>
                      <div style={{
                        border: "1px solid #1a1a1a", borderRadius: 8, padding: 14,
                        display: "flex", alignItems: "flex-start", gap: 12,
                        transition: "border-color 0.2s, background 0.2s",
                        cursor: "pointer",
                      }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#00ff8840"; (e.currentTarget as HTMLDivElement).style.background = "#00ff8805"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                      >
                        {/* Mini score */}
                        <div style={{ width: 44, height: 44, flexShrink: 0, position: "relative" }}>
                          <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 44 44">
                            <circle cx="22" cy="22" r="17" fill="none" stroke="#111" strokeWidth="4" />
                            <circle cx="22" cy="22" r="17" fill="none" stroke={color} strokeWidth="4"
                              strokeDasharray={2 * Math.PI * 17}
                              strokeDashoffset={2 * Math.PI * 17 - (c.analysis.score / 100) * 2 * Math.PI * 17}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: mono }}>{c.analysis.score}</span>
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: mono }}>{c.analysis.credentialTitle}</span>
                            <span style={{ fontSize: 9, color: "#333", fontFamily: mono, flexShrink: 0 }}>{date}</span>
                          </div>
                          <div style={{ fontSize: 10, color: "#444", fontFamily: mono, marginTop: 2 }}>{c.repo.name} · ★ {c.repo.stars}</div>
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
            </div>

            {/* Submit more */}
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <a href="/" style={{
                display: "inline-block", fontSize: 11, color: "#00ff88",
                fontFamily: mono, border: "1px solid #00ff8830",
                borderRadius: 6, padding: "10px 20px", textDecoration: "none",
                background: "#00ff8808",
              }}>
                + submit_another_project()
              </a>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
