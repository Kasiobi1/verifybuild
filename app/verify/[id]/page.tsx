"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Credential {
  id: string;
  walletAddress: string;
  issuedAt: string;
  status: string;
  repo: {
    name: string;
    description: string;
    stars: number;
    languages: Record<string, number>;
    githubUrl: string;
  };
  analysis: {
    skills: string[];
    levels: Record<string, string>;
    score: number;
    category: string;
    summary: string;
    highlights: string[];
    credentialTitle: string;
    flags: string[];
  };
}

const levelColor: Record<string, string> = {
  Beginner: "#00cc66",
  Intermediate: "#60a5fa",
  Advanced: "#a78bfa",
};

const scoreColor = (s: number) =>
  s >= 80 ? "#a78bfa" : s >= 60 ? "#60a5fa" : s >= 40 ? "#00ff88" : "#f87171";

function ScoreRing({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
      <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#111" strokeWidth="6" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "JetBrains Mono, monospace" }}>{score}</span>
        <span style={{ fontSize: 8, color: "#444", fontFamily: "JetBrains Mono, monospace" }}>score</span>
      </div>
    </div>
  );
}

const block = (label: string, children: React.ReactNode) => (
  <div style={{ border: "1px solid #1a1a1a", borderRadius: 8, padding: 16, marginBottom: 8 }}>
    <div style={{ fontSize: 9, color: "#444", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em", marginBottom: 12 }}>
      // {label}
    </div>
    {children}
  </div>
);

export default function VerifyPage() {
  const { id } = useParams();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/credentials?id=${id}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setCredential(data.credential); else setError("Credential not found."); })
      .catch(() => setError("Failed to load credential."))
      .finally(() => setLoading(false));
  }, [id]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  if (loading) return (
    <main style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 20, height: 20, border: "2px solid #1a1a1a", borderTopColor: "#00ff88", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 11, color: "#444", fontFamily: "JetBrains Mono, monospace" }}>loading_credential...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );

  if (error || !credential) return (
    <main style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#f87171", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>error: credential_not_found</p>
        <a href="/" style={{ fontSize: 10, color: "#444", fontFamily: "JetBrains Mono, monospace", textDecoration: "none" }}>← cd ~/home</a>
      </div>
    </main>
  );

  const { analysis, repo } = credential;
  const totalBytes = Object.values(repo.languages).reduce((a, b) => a + b, 0);
  const shortWallet = `${credential.walletAddress.slice(0, 6)}...${credential.walletAddress.slice(-4)}`;
  const issuedDate = new Date(credential.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <main style={{ minHeight: "100vh", background: "#000" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #1a1a1a", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)", zIndex: 50 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ color: "#00ff88", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 14, letterSpacing: "0.05em" }}>
            <span style={{ opacity: 0.4 }}>[</span>VERIXA<span style={{ opacity: 0.4 }}>]</span>
          </span>
        </a>
        <span style={{ fontSize: 9, color: "#333", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em" }}>
          // VERIFIED CREDENTIAL
        </span>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 48px", animation: "fadeIn 0.4s ease" }}>

        {/* Header block */}
        <div style={{ border: "1px solid #00ff8830", borderRadius: 10, padding: 20, marginBottom: 8, background: "#00ff8805" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: "#00ff88", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em", marginBottom: 8, opacity: 0.7 }}>
                ✦ VERIFIED ON-CHAIN
              </div>
              <div style={{ fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 700, color: "#fff", fontFamily: "JetBrains Mono, monospace", marginBottom: 6, lineHeight: 1.2 }}>
                {analysis.credentialTitle}
              </div>
              <a href={repo.githubUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 10, color: "#444", fontFamily: "JetBrains Mono, monospace", textDecoration: "none" }}>
                {repo.name} ★ {repo.stars}
              </a>
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  { val: analysis.category },
                  { val: shortWallet },
                  { val: issuedDate },
                ].map((tag) => (
                  <span key={tag.val} style={{ fontSize: 9, color: "#555", fontFamily: "JetBrains Mono, monospace", border: "1px solid #1a1a1a", borderRadius: 3, padding: "2px 8px" }}>
                    {tag.val}
                  </span>
                ))}
              </div>
            </div>
            <ScoreRing score={analysis.score} />
          </div>
        </div>

        {/* Summary */}
        {block("summary", (
          <p style={{ fontSize: 11, color: "#888", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7 }}>
            {analysis.summary}
          </p>
        ))}

        {/* Skills */}
        {block("skills_verified", (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {analysis.skills.map((skill) => {
              const level = analysis.levels[skill] || "Intermediate";
              return (
                <span key={skill} style={{
                  fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                  border: `1px solid ${levelColor[level]}40`,
                  color: levelColor[level], borderRadius: 3, padding: "2px 8px",
                  background: `${levelColor[level]}10`,
                }}>
                  {skill} <span style={{ opacity: 0.5 }}>· {level}</span>
                </span>
              );
            })}
          </div>
        ))}

        {/* Highlights */}
        {analysis.highlights?.length > 0 && block("technical_highlights", (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {analysis.highlights.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 10, fontSize: 11, color: "#666", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.5 }}>
                <span style={{ color: "#00ff88", flexShrink: 0 }}>→</span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Languages */}
        {totalBytes > 0 && block("languages", (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(repo.languages).sort(([, a], [, b]) => b - a).slice(0, 5).map(([lang, bytes]) => {
              const pct = Math.round((bytes / totalBytes) * 100);
              return (
                <div key={lang}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555", fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>
                    <span>{lang}</span><span>{pct}%</span>
                  </div>
                  <div style={{ height: 2, background: "#111", borderRadius: 1 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#00ff88", borderRadius: 1, boxShadow: "0 0 6px #00ff8860" }} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Share */}
        {block("share_credential", (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#000", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px", marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: "#00ff88", fontFamily: "JetBrains Mono, monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {shareUrl}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                style={{ fontSize: 9, color: "#555", fontFamily: "JetBrains Mono, monospace", background: "none", border: "1px solid #1a1a1a", borderRadius: 3, padding: "3px 8px", cursor: "pointer", flexShrink: 0 }}>
                [copy]
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href={`https://twitter.com/intent/tweet?text=Just verified my skills on-chain with @HACDLabs Verixa. Score: ${analysis.score}/100 — ${analysis.credentialTitle}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 10, color: "#60a5fa", fontFamily: "JetBrains Mono, monospace", border: "1px solid #60a5fa30", borderRadius: 4, padding: "6px 14px", textDecoration: "none", background: "#60a5fa10" }}>
                share_on_x()
              </a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 10, color: "#a78bfa", fontFamily: "JetBrains Mono, monospace", border: "1px solid #a78bfa30", borderRadius: 4, padding: "6px 14px", textDecoration: "none", background: "#a78bfa10" }}>
                share_on_linkedin()
              </a>
              <a href={`/profile/${credential.walletAddress}`}
                style={{ fontSize: 10, color: "#555", fontFamily: "JetBrains Mono, monospace", border: "1px solid #1a1a1a", borderRadius: 4, padding: "6px 14px", textDecoration: "none" }}>
                view_profile()
              </a>
            </div>
          </>
        ))}

      </div>
    </main>
  );
}
