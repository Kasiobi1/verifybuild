"use client";

import { useState } from "react";
import SubmitForm, { AnalysisResult } from "@/components/SubmitForm";
import WalletConnect from "@/components/WalletConnect";
import GitHubConnect from "@/components/GitHubConnect";

const mono = "JetBrains Mono, monospace";

export default function SubmitPage() {
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
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#00ff88", fontFamily: mono, fontWeight: 700, fontSize: 14, letterSpacing: "0.05em" }}>
            <span style={{ opacity: 0.4 }}>[</span>VERIXA<span style={{ opacity: 0.4 }}>]</span>
          </span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/" style={{ fontSize: 11, color: "#444", textDecoration: "none", fontFamily: mono }}>
            ← home
          </a>
          <GitHubConnect />
          <WalletConnect />
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>

        <div style={{ padding: "32px 0 24px" }}>
          <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 8 }}>
            // submit_proof
          </div>
          <h1 style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 700, fontFamily: mono, color: "#fff", marginBottom: 8 }}>
            Turn your repo into a credential
          </h1>
          <p style={{ fontSize: 11, color: "#555", fontFamily: mono, lineHeight: 1.6 }}>
            Paste a GitHub URL below. AI reads the code and issues a scored, on-chain credential to your wallet.
            Connect GitHub to unlock fork detection and contribution-verified scoring.
          </p>
        </div>

        <SubmitForm onResult={setResult} />

        <footer style={{ borderTop: "1px solid #1a1a1a", padding: "20px 0", marginTop: 48, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#333", fontFamily: mono }}>
            [VERIXA] — HACD Labs Incubator S2 · OKX AI Genesis
          </span>
          <span style={{ fontSize: 10, color: "#333", fontFamily: mono }}>
            powered by hacd + okx
          </span>
        </footer>
      </div>
    </main>
  );
}
