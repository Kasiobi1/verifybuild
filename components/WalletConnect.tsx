"use client";

import { useWallet } from "@/hooks/useWallet";

export default function WalletConnect() {
  const { isConnected, isConnecting, shortAddress, error, connect, disconnect } = useWallet();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      {isConnected ? (
        <button
          onClick={disconnect}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none",
            border: "1px solid #00ff8840",
            borderRadius: 4, padding: "4px 10px",
            fontSize: 10, color: "#00ff88",
            fontFamily: "JetBrains Mono, monospace",
            cursor: "pointer",
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ff88", display: "inline-block", animation: "pulse-green 2s infinite" }} />
          {shortAddress}
          <span style={{ color: "#333", fontSize: 9 }}>[x]</span>
        </button>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          style={{
            background: "none",
            border: "1px solid #1a1a1a",
            borderRadius: 4, padding: "4px 10px",
            fontSize: 10,
            color: isConnecting ? "#444" : "#555",
            fontFamily: "JetBrains Mono, monospace",
            cursor: isConnecting ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {isConnecting ? "connecting..." : "connect_wallet()"}
        </button>
      )}
      {error && (
        <span style={{ fontSize: 9, color: "#f87171", fontFamily: "JetBrains Mono, monospace", maxWidth: 180, textAlign: "right" }}>
          {error}
        </span>
      )}
      <style>{`
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,255,136,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(0,255,136,0); }
        }
      `}</style>
    </div>
  );
}
