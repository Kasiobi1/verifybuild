"use client";

import { useState, useRef } from "react";
import { useWallet } from "@/hooks/useWallet";

export interface AnalysisResult {
  success: boolean;
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

interface SubmitFormProps {
  onResult: (result: AnalysisResult) => void;
}

const levelColor: Record<string, string> = {
  Beginner: "#00cc66",
  Intermediate: "#60a5fa",
  Advanced: "#a78bfa",
};

const scoreColor = (score: number) =>
  score >= 80 ? "#a78bfa" : score >= 60 ? "#60a5fa" : score >= 40 ? "#00ff88" : "#f87171";

// ── URL Input Sheet (mobile-friendly) ────────────────────────────────────────
function UrlInputSheet({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.95)",
      display: "flex", flexDirection: "column",
      padding: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 11, color: "#00ff88", fontFamily: "JetBrains Mono, monospace" }}>
          // enter repository url
        </span>
        <button onClick={onClose} style={{
          background: "none", border: "1px solid #1a1a1a",
          color: "#666", fontFamily: "JetBrains Mono, monospace",
          fontSize: 11, padding: "4px 10px", borderRadius: 4, cursor: "pointer",
        }}>
          [esc]
        </button>
      </div>
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://github.com/you/your-project"
        rows={3}
        style={{
          background: "#0a0a0a", border: "1px solid #00ff88",
          borderRadius: 6, padding: 14, fontSize: 13,
          color: "#fff", fontFamily: "JetBrains Mono, monospace",
          resize: "none", outline: "none", lineHeight: 1.6,
          width: "100%",
        }}
      />
      <button
        onClick={onClose}
        style={{
          marginTop: 12, background: "#00ff88", border: "none",
          borderRadius: 6, padding: "12px", fontSize: 12,
          fontFamily: "JetBrains Mono, monospace", fontWeight: 700,
          color: "#000", cursor: "pointer", width: "100%",
        }}
      >
        confirm_url()
      </button>
    </div>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
      <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#111" strokeWidth="6" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "JetBrains Mono, monospace" }}>{score}</span>
        <span style={{ fontSize: 8, color: "#444", fontFamily: "JetBrains Mono, monospace" }}>score</span>
      </div>
    </div>
  );
}

// ── Result Card ───────────────────────────────────────────────────────────────
function ResultCard({ result }: { result: AnalysisResult }) {
  const { repo, analysis } = result;
  const { address, isConnected, connect } = useWallet();
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const totalBytes = Object.values(repo.languages).reduce((a, b) => a + b, 0);

  const handleIssue = async () => {
    if (!isConnected || !address) { connect(); return; }
    setIssuing(true);
    setIssueError(null);
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, repo, analysis }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setIssueError(data.error || "Failed."); return; }
      setShareUrl(data.shareUrl);
      setIssued(true);
    } catch { setIssueError("Network error. Please try again."); }
    finally { setIssuing(false); }
  };

  const block = (label: string, children: React.ReactNode) => (
    <div style={{ border: "1px solid #1a1a1a", borderRadius: 8, padding: 16, marginBottom: 8 }}>
      <div style={{ fontSize: 9, color: "#444", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em", marginBottom: 12 }}>
        // {label}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ marginTop: 24, animation: "fadeIn 0.4s ease" }}>

      {/* Header */}
      {block("credential_output", (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "#00ff88", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em", marginBottom: 6, opacity: 0.7 }}>
              ✦ VERIFIED CREDENTIAL
            </div>
            <div style={{ fontSize: "clamp(14px, 4vw, 18px)", fontWeight: 700, color: "#fff", fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>
              {analysis.credentialTitle}
            </div>
            <a href={repo.githubUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 10, color: "#444", fontFamily: "JetBrains Mono, monospace", textDecoration: "none" }}>
              {repo.name} ★ {repo.stars}
            </a>
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 9, color: "#555", fontFamily: "JetBrains Mono, monospace", border: "1px solid #1a1a1a", borderRadius: 3, padding: "2px 8px" }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00ff88", display: "inline-block" }} />
              {analysis.category}
            </div>
          </div>
          <ScoreRing score={analysis.score} />
        </div>
      ))}

      {/* Summary */}
      {block("summary", (
        <p style={{ fontSize: 11, color: "#888", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7 }}>
          {analysis.summary}
        </p>
      ))}

      {/* Skills */}
      {block("skills_detected", (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {analysis.skills.map((skill) => {
            const level = analysis.levels[skill] || "Intermediate";
            return (
              <span key={skill} style={{
                fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                border: `1px solid ${levelColor[level]}40`,
                color: levelColor[level],
                borderRadius: 3, padding: "2px 8px",
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

      {/* Flags */}
      {analysis.flags?.length > 0 && (
        <div style={{ border: "1px solid #fbbf2430", borderRadius: 8, padding: 16, marginBottom: 8, background: "#fbbf2408" }}>
          <div style={{ fontSize: 9, color: "#fbbf24", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em", marginBottom: 10 }}>
            // reviewer_notes
          </div>
          {analysis.flags.map((f, i) => (
            <div key={i} style={{ fontSize: 10, color: "#fbbf2480", fontFamily: "JetBrains Mono, monospace", marginBottom: 4, display: "flex", gap: 8 }}>
              <span>⚠</span><span>{f}</span>
            </div>
          ))}
        </div>
      )}

      {/* Issue CTA */}
      {issued && shareUrl ? (
        <div style={{ border: "1px solid #00ff8830", borderRadius: 8, padding: 20, background: "#00ff8808", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#00ff88", fontFamily: "JetBrains Mono, monospace", marginBottom: 12 }}>
            ✓ credential_issued()
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#000", border: "1px solid #1a1a1a",
            borderRadius: 6, padding: "10px 12px", marginBottom: 12,
          }}>
            <span style={{ fontSize: 10, color: "#00ff88", fontFamily: "JetBrains Mono, monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {shareUrl}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              style={{ fontSize: 9, color: "#555", fontFamily: "JetBrains Mono, monospace", background: "none", border: "1px solid #1a1a1a", borderRadius: 3, padding: "3px 8px", cursor: "pointer", flexShrink: 0 }}>
              [copy]
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={`https://twitter.com/intent/tweet?text=Just verified my skills on-chain with @HACDLabs Verixa. Score: ${analysis.score}/100 — ${analysis.credentialTitle}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 10, color: "#60a5fa", fontFamily: "JetBrains Mono, monospace", border: "1px solid #60a5fa30", borderRadius: 4, padding: "6px 14px", textDecoration: "none", background: "#60a5fa10" }}>
              share_on_x()
            </a>
            <a href={shareUrl}
              style={{ fontSize: 10, color: "#00ff88", fontFamily: "JetBrains Mono, monospace", border: "1px solid #00ff8830", borderRadius: 4, padding: "6px 14px", textDecoration: "none", background: "#00ff8810" }}>
              view_credential()
            </a>
          </div>
        </div>
      ) : (
        <>
          {issueError && (
            <div style={{ fontSize: 10, color: "#f87171", fontFamily: "JetBrains Mono, monospace", border: "1px solid #f8717130", borderRadius: 6, padding: "10px 14px", marginBottom: 8, background: "#f8717108" }}>
              error: {issueError}
            </div>
          )}
          <button
            onClick={handleIssue}
            disabled={issuing}
            style={{
              width: "100%",
              background: issuing ? "#0a0a0a" : "#00ff88",
              border: issuing ? "1px solid #1a1a1a" : "none",
              borderRadius: 8,
              padding: "14px 20px",
              fontSize: "clamp(11px, 3vw, 13px)",
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700,
              color: issuing ? "#444" : "#000",
              cursor: issuing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
              boxShadow: issuing ? "none" : "0 0 20px rgba(0,255,136,0.3)",
            }}
          >
            {issuing ? (
              <>
                <span style={{ width: 10, height: 10, border: "2px solid #333", borderTopColor: "#00ff88", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                issuing...
              </>
            ) : !isConnected ? (
              "connect_wallet() → issue_credential()"
            ) : (
              "./issue_credential.sh"
            )}
          </button>
        </>
      )}
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────────────────────
export default function SubmitForm({ onResult }: SubmitFormProps) {
  const [githubUrl, setGithubUrl] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showUrlSheet, setShowUrlSheet] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async () => {
    setError(""); setResult(null);
    if (!githubUrl.trim()) { setError("github url is required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl, contractAddress, liveUrl, extraContext }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "analysis failed."); return; }
      setResult(data);
      onResult(data);
    } catch { setError("network error. check your api keys."); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    width: "100%",
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 11,
    color: "#888",
    fontFamily: "JetBrains Mono, monospace",
    outline: "none",
  };

  return (
    <div style={{ width: "100%" }}>
      {showUrlSheet && (
        <UrlInputSheet
          value={githubUrl}
          onChange={setGithubUrl}
          onClose={() => setShowUrlSheet(false)}
        />
      )}

      <div style={{ border: "1px solid #1a1a1a", borderRadius: 10, background: "#0a0a0a", overflow: "hidden" }}>

        {/* Terminal header bar */}
        <div style={{
          background: "#111", borderBottom: "1px solid #1a1a1a",
          padding: "8px 14px", display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", display: "inline-block" }} />
          <span style={{ fontSize: 10, color: "#333", fontFamily: "JetBrains Mono, monospace", marginLeft: 8 }}>
            verixa ~ analyze.sh
          </span>
        </div>

        <div style={{ padding: 16 }}>
          {/* Prompt line */}
          <div style={{ fontSize: 10, color: "#00ff88", fontFamily: "JetBrains Mono, monospace", marginBottom: 10, opacity: 0.6 }}>
            verixa@hacd ~ % analyze
          </div>

          {/* GitHub URL */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: "#444", fontFamily: "JetBrains Mono, monospace", marginBottom: 6, letterSpacing: "0.08em" }}>
              --repo <span style={{ color: "#f87171" }}>*required</span>
            </div>
            <div
              onClick={() => setShowUrlSheet(true)}
              style={{
                ...inputStyle,
                cursor: "text",
                color: githubUrl ? "#00ff88" : "#333",
                border: githubUrl ? "1px solid #00ff8840" : "1px solid #1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {githubUrl || "https://github.com/you/your-project"}
              </span>
              <span style={{ color: "#333", flexShrink: 0, marginLeft: 8 }}>[edit]</span>
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 10, color: "#333", fontFamily: "JetBrains Mono, monospace",
              padding: "4px 0", marginBottom: showAdvanced ? 10 : 0,
            }}
          >
            {showAdvanced ? "▼" : "▶"} --advanced-options
          </button>

          {showAdvanced && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: "#444", fontFamily: "JetBrains Mono, monospace", marginBottom: 6, letterSpacing: "0.08em" }}>
                  --contract <span style={{ color: "#333" }}>optional</span>
                </div>
                <input
                  type="text" placeholder="0x..."
                  value={contractAddress} onChange={(e) => setContractAddress(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#444", fontFamily: "JetBrains Mono, monospace", marginBottom: 6, letterSpacing: "0.08em" }}>
                  --live-url <span style={{ color: "#333" }}>optional</span>
                </div>
                <input
                  type="url" placeholder="https://yourproject.xyz"
                  value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#444", fontFamily: "JetBrains Mono, monospace", marginBottom: 6, letterSpacing: "0.08em" }}>
                  --context <span style={{ color: "#333" }}>optional</span>
                </div>
                <textarea
                  rows={3} placeholder="Briefly describe what you built..."
                  value={extraContext} onChange={(e) => setExtraContext(e.target.value)}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 10, color: "#f87171", fontFamily: "JetBrains Mono, monospace", marginBottom: 10, padding: "8px 12px", border: "1px solid #f8717130", borderRadius: 6, background: "#f8717108" }}>
              error: {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#0a0a0a" : "#000",
              border: loading ? "1px solid #1a1a1a" : "1px solid #00ff88",
              borderRadius: 6,
              padding: "11px 16px",
              fontSize: 11,
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 600,
              color: loading ? "#444" : "#00ff88",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 10, height: 10,
                  border: "2px solid #1a1a1a", borderTopColor: "#00ff88",
                  borderRadius: "50%", display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }} />
                analyzing_repository...
              </>
            ) : (
              "$ run analyze.sh"
            )}
          </button>
        </div>
      </div>

      {result && <ResultCard result={result} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
