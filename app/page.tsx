"use client";

import { useState } from "react";
import SubmitForm, { AnalysisResult } from "@/components/SubmitForm";
import WalletConnect from "@/components/WalletConnect";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  return (
    <main style={{ minHeight: "100vh", background: "#000" }}>

      {/* Nav */}
      <nav style={{
        borderBottom: "1px solid #1a1a1a",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "rgba(0,0,0,0.95)",
        backdropFilter: "blur(10px)",
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            color: "#00ff88",
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.05em",
          }}>
            <span style={{ opacity: 0.4 }}>[</span>
            VERIXA
            <span style={{ opacity: 0.4 }}>]</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="#how" style={{ fontSize: 11, color: "#444", textDecoration: "none", fontFamily: "JetBrains Mono, monospace" }}>
            ./how-it-works
          </a>
          <a href="/demo/dao-check" style={{ fontSize: 11, color: "#444", textDecoration: "none", fontFamily: "JetBrains Mono, monospace" }}>
            ./asp-demo
          </a>
          <WalletConnect />
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>

        {/* Hero */}
        <div style={{ padding: "48px 0 32px", textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            color: "#00ff88",
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: "0.1em",
            border: "1px solid #00ff8830",
            borderRadius: 4,
            padding: "3px 10px",
            marginBottom: 20,
            opacity: 0.7,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ff88", display: "inline-block", animation: "pulse-green 2s infinite" }} />
            HACD LABS INCUBATOR S2 · OKX AI GENESIS
          </div>

          <h1 style={{
            fontSize: "clamp(28px, 7vw, 48px)",
            fontWeight: 700,
            fontFamily: "JetBrains Mono, monospace",
            color: "#fff",
            lineHeight: 1.15,
            marginBottom: 16,
          }}>
            Your code is your<br />
            <span style={{ color: "#00ff88" }}>credential_</span>
          </h1>

          <p style={{
            fontSize: 12,
            color: "#555",
            fontFamily: "JetBrains Mono, monospace",
            lineHeight: 1.7,
            marginBottom: 32,
            maxWidth: 420,
            margin: "0 auto 32px",
          }}>
            Submit a GitHub repo. AI reads the actual code.<br />
            A verifiable credential gets issued on-chain.
          </p>

          {/* Stats row */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "clamp(16px, 5vw, 40px)",
            marginBottom: 40,
            flexWrap: "wrap",
          }}>
            {[
              { val: "AI-scored", lbl: "not self-reported" },
              { val: "on-chain", lbl: "permanently verifiable" },
              { val: "60s", lbl: "to your credential" },
            ].map((s) => (
              <div key={s.lbl} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#00ff88", fontFamily: "JetBrains Mono, monospace" }}>{s.val}</div>
                <div style={{ fontSize: 9, color: "#444", fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit form */}
        <SubmitForm onResult={setResult} />

        {/* How it works */}
        <section id="how" style={{ padding: "64px 0 48px", borderTop: "1px solid #1a1a1a", marginTop: 64 }}>
          <div style={{
            fontSize: 9,
            color: "#444",
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: "0.12em",
            marginBottom: 24,
          }}>
            // HOW IT WORKS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[
              { step: "01", cmd: "submit_proof()", desc: "Paste your GitHub URL, deployed contract address, or live project link." },
              { step: "02", cmd: "analyze_code()", desc: "AI reads your repository — structure, languages, complexity, tests, and docs." },
              { step: "03", cmd: "issue_credential()", desc: "A scored, categorized credential is saved and tied to your wallet address." },
            ].map((item) => (
              <div key={item.step} style={{
                display: "flex",
                gap: 16,
                padding: "16px 0",
                borderBottom: "1px solid #111",
                alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 9, color: "#333", fontFamily: "JetBrains Mono, monospace", paddingTop: 2, minWidth: 20 }}>
                  {item.step}
                </span>
                <div>
                  <div style={{ fontSize: 12, color: "#00ff88", fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>
                    {item.cmd}
                  </div>
                  <div style={{ fontSize: 11, color: "#555", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          borderTop: "1px solid #1a1a1a",
          padding: "20px 0",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}>
          <span style={{ fontSize: 10, color: "#333", fontFamily: "JetBrains Mono, monospace" }}>
            [VERIXA] — HACD Labs Incubator S2 · OKX AI Genesis
          </span>
          <span style={{ fontSize: 10, color: "#333", fontFamily: "JetBrains Mono, monospace" }}>
            powered by hacd + okx
          </span>
        </footer>
      </div>
    </main>
  );
}
