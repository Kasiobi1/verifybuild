"use client";

import { useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useRouter } from "next/navigation";

const mono = "JetBrains Mono, monospace";

export default function ConnectPage() {
  const { isConnected, isConnecting, address, error, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address) {
      router.push(`/profile/${address}`);
    }
  }, [isConnected, address, router]);

  return (
    <main style={{ minHeight: "100vh", background: "#000" }}>
      <style>{`
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,255,136,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(0,255,136,0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #1a1a1a", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)", zIndex: 50 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ color: "#00ff88", fontFamily: mono, fontWeight: 700, fontSize: 14, letterSpacing: "0.05em" }}>
            <span style={{ opacity: 0.4 }}>[</span>VERIXA<span style={{ opacity: 0.4 }}>]</span>
          </span>
        </a>
        <span style={{ fontSize: 9, color: "#333", fontFamily: mono, letterSpacing: "0.1em" }}>// CONNECT</span>
      </nav>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 20px 48px", textAlign: "center", animation: "fadeIn 0.4s ease" }}>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          border: "1px solid #00ff8830",
          background: "#00ff8808",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 28,
          animation: isConnecting ? "pulse-green 1.5s infinite" : "none",
        }}>
          ◉
        </div>

        <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 12 }}>
          // connect_wallet
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: mono, marginBottom: 12, lineHeight: 1.2 }}>
          Connect your wallet<br />
          <span style={{ color: "#00ff88" }}>to view your profile_</span>
        </h1>

        <p style={{ fontSize: 11, color: "#444", fontFamily: mono, lineHeight: 1.7, marginBottom: 40, maxWidth: 320, margin: "0 auto 40px" }}>
          Your profile shows all credentials tied to your wallet address. Connect OKX Wallet or MetaMask to access your verified builder identity.
        </p>

        {/* Steps */}
        <div style={{ border: "1px solid #1a1a1a", borderRadius: 10, padding: 20, marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 16 }}>
            // what_happens_next
          </div>
          {[
            { step: "01", text: "Your wallet opens and asks for approval" },
            { step: "02", text: "We read your wallet address — nothing else" },
            { step: "03", text: "You're taken to your builder profile" },
          ].map((item) => (
            <div key={item.step} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 9, color: "#333", fontFamily: mono, paddingTop: 1, minWidth: 20 }}>{item.step}</span>
              <span style={{ fontSize: 11, color: "#666", fontFamily: mono, lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ fontSize: 10, color: "#f87171", fontFamily: mono, border: "1px solid #f8717130", borderRadius: 6, padding: "10px 14px", marginBottom: 16, background: "#f8717108" }}>
            error: {error}
          </div>
        )}

        <button
          onClick={() => connect("okx")}
          disabled={isConnecting}
          style={{
            width: "100%",
            background: isConnecting ? "#0a0a0a" : "#00ff88",
            border: isConnecting ? "1px solid #1a1a1a" : "none",
            borderRadius: 8,
            padding: "14px 20px",
            fontSize: 12,
            fontFamily: mono,
            fontWeight: 700,
            color: isConnecting ? "#444" : "#000",
            cursor: isConnecting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
            boxShadow: isConnecting ? "none" : "0 0 20px rgba(0,255,136,0.3)",
            marginBottom: 10,
          }}
        >
          {isConnecting ? (
            <>
              <span style={{ width: 10, height: 10, border: "2px solid #333", borderTopColor: "#00ff88", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              connecting...
            </>
          ) : (
            "connect_okx_wallet()"
          )}
        </button>

        <button
          onClick={() => connect("metamask")}
          disabled={isConnecting}
          style={{
            width: "100%",
            background: "none",
            border: "1px solid #1a1a1a",
            borderRadius: 8,
            padding: "14px 20px",
            fontSize: 12,
            fontFamily: mono,
            fontWeight: 700,
            color: isConnecting ? "#333" : "#666",
            cursor: isConnecting ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            marginBottom: 12,
          }}
        >
          connect_metamask()
        </button>

        <p style={{ fontSize: 10, color: "#333", fontFamily: mono }}>
          We never store your private key or sign any transactions
        </p>

      </div>
    </main>
  );
}
