"use client";

import WalletConnect from "@/components/WalletConnect";

const mono = "JetBrains Mono, monospace";

export default function Home() {
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
          <span style={{ color: "#00ff88", fontFamily: mono, fontWeight: 700, fontSize: 14, letterSpacing: "0.05em" }}>
            <span style={{ opacity: 0.4 }}>[</span>VERIXA<span style={{ opacity: 0.4 }}>]</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="#how" style={{ fontSize: 11, color: "#00ff88", textDecoration: "none", fontFamily: mono, border: "1px solid #00ff8840", borderRadius: 5, padding: "5px 12px", background: "#00ff8810" }}>
            ./how-it-works
          </a>
          <a href="/demo/dao-check" style={{ fontSize: 11, color: "#00ff88", textDecoration: "none", fontFamily: mono, border: "1px solid #00ff8840", borderRadius: 5, padding: "5px 12px", background: "#00ff8810" }}>
            ./asp-demo
          </a>
          <a href="/submit" style={{
            fontSize: 11, color: "#000", textDecoration: "none", fontFamily: mono, fontWeight: 700,
            border: "none", borderRadius: 5, padding: "5px 12px", background: "#00ff88",
            boxShadow: "0 0 12px rgba(0,255,136,0.4)",
          }}>
            launch_app() →
          </a>
          <WalletConnect />
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 20px" }}>

        {/* Hero */}
        <div style={{ padding: "56px 0 32px", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#00ff88",
            fontFamily: mono, letterSpacing: "0.1em", border: "1px solid #00ff8830", borderRadius: 4,
            padding: "3px 10px", marginBottom: 20, opacity: 0.7,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ff88", display: "inline-block", animation: "pulse-green 2s infinite" }} />
            HACD LABS INCUBATOR S2 · OKX AI GENESIS
          </div>

          <h1 style={{ fontSize: "clamp(28px, 7vw, 48px)", fontWeight: 700, fontFamily: mono, color: "#fff", lineHeight: 1.15, marginBottom: 16 }}>
            Your code is your<br />
            <span style={{ color: "#00ff88" }}>credential_</span>
          </h1>

          <p style={{ fontSize: 12, color: "#555", fontFamily: mono, lineHeight: 1.7, marginBottom: 28, maxWidth: 460, margin: "0 auto 28px" }}>
            Submit a GitHub repo. AI reads the actual code. A verifiable credential gets issued
            on-chain — queryable by any DAO, grants program, or hiring bot as a paid Agent Service.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
            <a href="/submit" style={{
              fontSize: 12, fontWeight: 700, color: "#000", textDecoration: "none", fontFamily: mono,
              background: "#00ff88", borderRadius: 8, padding: "12px 24px", boxShadow: "0 0 20px rgba(0,255,136,0.3)",
            }}>
              launch_app() →
            </a>
            <a href="/demo/dao-check" style={{
              fontSize: 12, fontWeight: 700, color: "#00ff88", textDecoration: "none", fontFamily: mono,
              border: "1px solid #00ff8840", borderRadius: 8, padding: "12px 24px",
            }}>
              see_asp_demo()
            </a>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(16px, 5vw, 40px)", marginBottom: 8, flexWrap: "wrap" }}>
            {[
              { val: "AI-scored", lbl: "not self-reported" },
              { val: "on-chain", lbl: "permanently verifiable" },
              { val: "60s", lbl: "to your credential" },
            ].map((s) => (
              <div key={s.lbl} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#00ff88", fontFamily: mono }}>{s.val}</div>
                <div style={{ fontSize: 9, color: "#444", fontFamily: mono, marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Value props */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 48 }}>
          {[
            { icon: "◆", title: "AI-verified", desc: "Scored from your actual code — commits, structure, tests. Not self-reported." },
            { icon: "◇", title: "On-chain", desc: "Every credential is permanent and publicly checkable, tied to your wallet." },
            { icon: "◈", title: "Agent-queryable", desc: "DAOs, grants, and hiring bots can verify a wallet's credential programmatically." },
          ].map((v) => (
            <div key={v.title} style={{ border: "1px solid #1a1a1a", borderRadius: 10, padding: "18px 16px", background: "#0a0a0a" }}>
              <div style={{ fontSize: 16, color: "#00ff88", marginBottom: 8 }}>{v.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: mono, marginBottom: 6 }}>{v.title}</div>
              <div style={{ fontSize: 10, color: "#666", fontFamily: mono, lineHeight: 1.6 }}>{v.desc}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section id="how" style={{ padding: "0 0 48px" }}>
          <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.12em", marginBottom: 20 }}>
            // HOW IT WORKS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {[
              { step: "01", cmd: "submit_proof()", desc: "Paste your GitHub URL, deployed contract address, or live project link." },
              { step: "02", cmd: "analyze_code()", desc: "AI reads your repository — structure, languages, complexity, tests, and docs." },
              { step: "03", cmd: "issue_credential()", desc: "A scored, categorized credential is saved and tied to your wallet address." },
              { step: "04", cmd: "agents_verify()", desc: "DAOs, grants, and bots query your credential via Verixa's ASP endpoint — pay-per-call, no account needed." },
            ].map((item) => (
              <div key={item.step} style={{ border: "1px solid #1a1a1a", borderRadius: 10, padding: 18, background: "#0a0a0a" }}>
                <span style={{ fontSize: 9, color: "#333", fontFamily: mono }}>{item.step}</span>
                <div style={{ fontSize: 12, color: "#00ff88", fontFamily: mono, margin: "6px 0" }}>{item.cmd}</div>
                <div style={{ fontSize: 10, color: "#666", fontFamily: mono, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section style={{ padding: "0 0 56px", borderTop: "1px solid #1a1a1a", paddingTop: 48 }}>
          <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.12em", marginBottom: 6 }}>
            // PRICING
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: mono, marginBottom: 24 }}>
            Free to mint. Pay-per-call to verify.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 24 }}>
            <div style={{ border: "1px solid #00ff8830", borderRadius: 10, padding: 20, background: "#00ff8808" }}>
              <div style={{ fontSize: 9, color: "#00ff88", fontFamily: mono, letterSpacing: "0.08em", marginBottom: 8 }}>FOR BUILDERS</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#00ff88", fontFamily: mono, marginBottom: 12 }}>Free</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {["Submit any public repo", "AI scoring + radar breakdown", "On-chain credential minted to your wallet"].map((f) => (
                  <li key={f} style={{ fontSize: 10, color: "#888", fontFamily: mono, display: "flex", gap: 6 }}>
                    <span style={{ color: "#00ff88" }}>·</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ border: "1px solid #60a5fa30", borderRadius: 10, padding: 20, background: "#60a5fa08" }}>
              <div style={{ fontSize: 9, color: "#60a5fa", fontFamily: mono, letterSpacing: "0.08em", marginBottom: 8 }}>FOR AGENTS / DAOS</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#60a5fa", fontFamily: mono, marginBottom: 12 }}>
                $0.01 <span style={{ fontSize: 11, color: "#555", fontWeight: 400 }}>/ query</span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {["Check any wallet's verified credential", "Paid via x402 on OKX X Layer — no account, no API key required", "Or use a pre-arranged partner API key, free"].map((f) => (
                  <li key={f} style={{ fontSize: 10, color: "#888", fontFamily: mono, display: "flex", gap: 6 }}>
                    <span style={{ color: "#60a5fa" }}>·</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ border: "1px solid #1a1a1a", borderRadius: 10, background: "#050505", padding: 20 }}>
            <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 14 }}>
              // FOR AGENT DEVELOPERS — two calls to a verdict
            </div>
            <pre style={{ margin: 0, fontSize: 10, color: "#666", fontFamily: mono, lineHeight: 1.8, overflowX: "auto" }}>
{`# 1. Call without payment — get the x402 challenge
curl -X POST https://verifybuild-gules.vercel.app/api/verify-query \\
  -H "Content-Type: application/json" \\
  -d '{"wallet":"0xTheirWallet"}'
# → 402, returns price + payTo + network to pay

# 2. Sign the payment, retry with X-PAYMENT header
curl -X POST https://verifybuild-gules.vercel.app/api/verify-query \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT: <base64 signed payload>" \\
  -d '{"wallet":"0xTheirWallet"}'
# → 200, returns verified status, confidence score, credential`}
            </pre>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid #1a1a1a", padding: "20px 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#00ff88", fontFamily: mono, fontWeight: 600, letterSpacing: "0.03em" }}>
            [VERIXA] — HACD Labs Incubator S2 · OKX AI Genesis
          </span>
          <span style={{ fontSize: 11, color: "#00ff88", fontFamily: mono, fontWeight: 600 }}>
            powered by hacd + okx
          </span>
        </footer>
      </div>

      <style>{`
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,255,136,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(0,255,136,0); }
        }
      `}</style>
    </main>
  );
}
