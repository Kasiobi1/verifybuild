"use client";

import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";

const mono = "JetBrains Mono, monospace";

export default function BottomNav() {
  const pathname = usePathname();
  const { address, isConnected } = useWallet();

  const profileHref = isConnected && address ? `/profile/${address}` : "/connect";

  const items = [
    { label: "home",    icon: "⌂", href: "/" },
    { label: "explore", icon: "⊞", href: "/explore" },
    { label: "rank",    icon: "◈", href: "/leaderboard" },
    { label: "profile", icon: "◉", href: profileHref },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/connect") return pathname === "/connect";
    const base = href.split("/").slice(0, 2).join("/");
    return pathname.startsWith(base);
  };

  return (
    <>
      <div style={{ height: 64 }} />
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(0,0,0,0.97)",
        borderTop: "1px solid #1a1a1a",
        backdropFilter: "blur(12px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
        height: 64,
      }}>
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <a key={item.label} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none", padding: "4px 20px", borderRadius: 6, transition: "all 0.2s", opacity: active ? 1 : 0.4 }}>
              <span style={{ fontSize: 16, color: active ? "#00ff88" : "#555", filter: active ? "drop-shadow(0 0 6px #00ff88)" : "none", transition: "all 0.2s" }}>
                {item.icon}
              </span>
              <span style={{ fontSize: 9, fontFamily: mono, color: active ? "#00ff88" : "#444", letterSpacing: "0.05em" }}>
                {item.label}
              </span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
