"use client";

import { useState } from "react";

const mono = "JetBrains Mono, monospace";

interface QueryResult {
  verified: boolean;
  wallet: string;
  confidenceScore: number | null;
  overallSkillLevel: string | null;
  perSkillLevels: Record<string, string> | null;
  credentialId: string | null;
  repoUrl: string | null;
  credentialTitle: string | null;
  category: string | null;
  radarBreakdown: Record<string, number> | null;
  verifiedAt: string | null;
  reason?: string;
}

interface LogLine {
  message: string;
  type: "system" | "info" | "success" | "warn" | "error";
}

const logColor: Record<string, string> = {
  system: "#00ff88",
  info: "#60a5fa",
  success: "#00ff88",
  warn: "#fbbf24",
  error: "#f87171",
};

export default function DaoCheckDemo() {
  const [wallet, setWallet] = useState("");
  const [skillDomain, setSkillDomain] = useState("");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [result, setResult] = useState<QueryResult | null>(null);

  const log = (message: string, type: LogLine["type"] = "info") =>
    setLogs((prev) => [...prev, { message, type }]);

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runQuery = async () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet.trim())) {
      log("error: not a valid EVM wallet address", "error");
      return;
    }

    setResult(null);
    setLogs([]);
    setRunning(true);

    log("$ dao-bot ~ initiating contributor check...", "system");
    await wait(300);
    log(`→ querying Verixa ASP for wallet ${wallet.slice(0, 6)}...${wallet.slice(-4)}`, "info");
    await wait(400);
    if (skillDomain.trim()) {
      log(`→ filtering for domain: "${skillDomain.trim()}"`, "info");
      await wait(300);
    }
    log("→ calling POST /api/verify-query ...", "info");

    try {
      const res = await fetch("/api/demo-dao-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: wallet.trim().toLowerCase(),
          skillDomain: skillDomain.trim() || "any",
        }),
      });
      const data: QueryResult = await res.json();

      await wait(300);
      if (data.verified) {
        log(`✓ credential found — confidence score ${data.confidenceScore}/100`, "success");
        await wait(200);
        log(`✓ overall level: ${data.overallSkillLevel}`, "success");
        await wait(200);
        log("$ decision → grant access / approve bounty", "system");
      } else {
        log("⚠ no verified credential found for this wallet", "warn");
        await wait(200);
        log("$ decision → deny / request manual review", "system");
      }

      setResult(data);
    } catch {
      log("error: request failed", "error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "#000", padding: "48px 20px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 8 }}>
          // agent_service_provider_demo
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: mono, marginBottom: 8 }}>
          Simulate a DAO bot checking a builder
        </h1>
        <p style={{ fontSize: 11, color: "#666", fontFamily: mono, lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
          This simulates a third-party agent — a DAO onboarding bot, a grants dashboard, a hackathon
          discovery tool — calling Verixa&apos;s ASP endpoint to check whether a wallet has a verified
          skill credential before granting access, approving a bounty, or listing a builder.
        </p>

        <div style={{ border: "1px solid #1a1a1a", borderRadius: 10, background: "#0a0a0a", overflow: "hidden" }}>
          <div style={{ background: "#111", borderBottom: "1px solid #1a1a1a", padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", display: "inline-block" }} />
            <span style={{ fontSize: 10, color: "#333", fontFamily: mono, marginLeft: 8 }}>dao-bot ~ contributor-check.sh</span>
          </div>

          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#444", fontFamily: mono, marginBottom: 6 }}>--wallet <span style={{ color: "#f87171" }}>*required</span></div>
              <input
                type="text"
                placeholder="0x..."
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                style={{ width: "100%", background: "#000", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px", fontSize: 11, color: "#00ff88", fontFamily: mono, outline: "none" }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: "#444", fontFamily: mono, marginBottom: 6 }}>--skill-domain <span style={{ color: "#333" }}>optional, e.g. "solidity"</span></div>
              <input
                type="text"
                placeholder="any"
                value={skillDomain}
                onChange={(e) => setSkillDomain(e.target.value)}
                style={{ width: "100%", background: "#000", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 12px", fontSize: 11, color: "#888", fontFamily: mono, outline: "none" }}
              />
            </div>

            <button
              onClick={runQuery}
              disabled={running || !wallet.trim()}
              style={{
                width: "100%",
                background: running ? "#0a0a0a" : "#000",
                border: running ? "1px solid #1a1a1a" : "1px solid #00ff88",
                borderRadius: 6,
                padding: "11px 16px",
                fontSize: 11,
                fontFamily: mono,
                fontWeight: 600,
                color: running ? "#444" : "#00ff88",
                cursor: running || !wallet.trim() ? "not-allowed" : "pointer",
              }}
            >
              {running ? "querying..." : "$ run contributor-check.sh"}
            </button>
          </div>
        </div>

        {logs.length > 0 && (
          <div style={{ border: "1px solid #1a1a1a", borderRadius: 10, background: "#050505", overflow: "hidden", marginTop: 12 }}>
            <div style={{ background: "#0a0a0a", borderBottom: "1px solid #1a1a1a", padding: "6px 14px" }}>
              <span style={{ fontSize: 9, color: "#444", fontFamily: mono }}>agent.log</span>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
              {logs.map((l, i) => (
                <div key={i} style={{ fontSize: 10, fontFamily: mono, color: logColor[l.type], display: "flex", gap: 8 }}>
                  <span style={{ color: "#333", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{l.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: 12,
              border: `1px solid ${result.verified ? "#00ff8830" : "#fbbf2430"}`,
              borderRadius: 10,
              padding: 20,
              background: result.verified ? "#00ff8808" : "#fbbf2408",
            }}
          >
            <div style={{ fontSize: 9, color: result.verified ? "#00ff88" : "#fbbf24", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 12 }}>
              {result.verified ? "✓ CREDENTIAL VERIFIED" : "⚠ NOT VERIFIED"}
            </div>

            {result.verified ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: mono, marginBottom: 4 }}>
                  {result.credentialTitle}
                </div>
                <div style={{ fontSize: 11, color: "#666", fontFamily: mono, marginBottom: 12 }}>
                  {result.category} · confidence score {result.confidenceScore}/100 · {result.overallSkillLevel}
                </div>
                {result.perSkillLevels && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {Object.entries(result.perSkillLevels).map(([skill, level]) => (
                      <span key={skill} style={{ fontSize: 10, fontFamily: mono, border: "1px solid #60a5fa40", color: "#60a5fa", borderRadius: 3, padding: "2px 8px", background: "#60a5fa10" }}>
                        {skill} <span style={{ opacity: 0.6 }}>· {level}</span>
                      </span>
                    ))}
                  </div>
                )}
                {result.repoUrl && (
                  <a href={result.repoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#444", fontFamily: mono, textDecoration: "none" }}>
                    view source repo →
                  </a>
                )}
              </>
            ) : (
              <p style={{ fontSize: 11, color: "#888", fontFamily: mono, lineHeight: 1.6 }}>{result.reason}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
