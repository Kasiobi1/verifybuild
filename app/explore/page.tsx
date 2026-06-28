"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Credential {
  id: string;
  walletAddress: string;
  issuedAt: string;
  repo: { name: string; githubUrl: string; stars: number; };
  analysis: {
    skills: string[];
    score: number;
    category: string;
    credentialTitle: string;
  };
}

const scoreColor = (s: number) =>
  s >= 80 ? "#a78bfa" : s >= 60 ? "#60a5fa" : s >= 40 ? "#00ff88" : "#f87171";

const mono = "JetBrains Mono, monospace";

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);

  const fetchCredentials = useCallback(async (q: string) => {
    setLoading(true);
    setError("");
    try {
      const url = q ? `/api/credentials?q=${encodeURIComponent(q)}` : "/api/credentials?wallet=all";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setCredentials(data.credentials);
      else setError("No credentials found.");
    } catch {
      setError("Failed to load credentials.");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials(initialQuery);
  }, [fetchCredentials, initialQuery]);

  const handleSearch = () => {
    const q = inputValue.trim();
    setQuery(q);
    setIsSearching(true);
    setFilter("all");
    if (q) router.push(`/explore?q=${encodeURIComponent(q)}`);
    else router.push("/explore");
    fetchCredentials(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setInputValue("");
    setQuery("");
    setFilter("all");
    router.push("/explore");
    fetchCredentials("");
  };

  // wallet address search → go to profile
  const handleWalletSearch = () => {
    const q = inputValue.trim();
    if (q.startsWith("0x") && q.length === 42) {
      router.push(`/profile/${q}`);
    } else {
      handleSearch();
    }
  };

  const categories = ["all", ...new Set(credentials.map((c) => c.analysis.category))];
  const filtered = filter === "all" ? credentials : credentials.filter((c) => c.analysis.category === filter);
  const isWalletAddress = inputValue.trim().startsWith("0x") && inputValue.trim().length === 42;

  return (
    <main style={{ minHeight: "100vh", background: "#000" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #1a1a1a", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)", zIndex: 50 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ color: "#00ff88", fontFamily: mono, fontWeight: 700, fontSize: 14, letterSpacing: "0.05em" }}>
            <span style={{ opacity: 0.4 }}>[</span>VERIXA<span style={{ opacity: 0.4 }}>]</span>
          </span>
        </a>
        <span style={{ fontSize: 9, color: "#333", fontFamily: mono, letterSpacing: "0.1em" }}>// EXPLORE</span>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, color: "#444", fontFamily: mono, letterSpacing: "0.1em", marginBottom: 8 }}>
            // explore_credentials
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: mono, marginBottom: 4 }}>
            All verified builders
          </h1>
          <p style={{ fontSize: 11, color: "#444", fontFamily: mono }}>
            Search by skill, wallet, project name, or credential title
          </p>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              background: "#0a0a0a", border: `1px solid ${inputValue ? "#00ff8840" : "#1a1a1a"}`,
              borderRadius: 6, padding: "0 12px", transition: "border-color 0.2s",
            }}>
              <span style={{ color: "#00ff88", fontFamily: mono, fontSize: 11, flexShrink: 0 }}>$</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="search skills, wallet, project..."
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontSize: 11, color: "#888", fontFamily: mono, padding: "11px 0",
                }}
              />
              {inputValue && (
                <button onClick={handleClear} style={{ background: "none", border: "none", color: "#333", fontFamily: mono, fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
                  [x]
                </button>
              )}
            </div>
            <button
              onClick={isWalletAddress ? handleWalletSearch : handleSearch}
              disabled={isSearching}
              style={{
                background: "#00ff88", border: "none", borderRadius: 6,
                padding: "0 16px", fontSize: 11, fontFamily: mono,
                fontWeight: 700, color: "#000", cursor: "pointer",
                flexShrink: 0, transition: "all 0.2s",
                opacity: isSearching ? 0.5 : 1,
              }}
            >
              {isSearching ? "..." : isWalletAddress ? "profile()" : "search()"}
            </button>
          </div>

          {/* Search hints */}
          {!query && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {["Solidity", "TypeScript", "DeFi", "Next.js"].map((hint) => (
                <button key={hint} onClick={() => { setInputValue(hint); }} style={{
                  fontSize: 9, fontFamily: mono, padding: "2px 8px", borderRadius: 3,
                  border: "1px solid #1a1a1a", color: "#444", background: "none",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  {hint}
                </button>
              ))}
            </div>
          )}

          {/* Active search indicator */}
          {query && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 9, color: "#444", fontFamily: mono }}>
                results for:
              </span>
              <span style={{ fontSize: 9, color: "#00ff88", fontFamily: mono, border: "1px solid #00ff8830", borderRadius: 3, padding: "1px 8px" }}>
                {query}
              </span>
              <button onClick={handleClear} style={{ fontSize: 9, color: "#333", fontFamily: mono, background: "none", border: "none", cursor: "pointer" }}>
                clear
              </button>
            </div>
          )}
        </div>

        {/* Category filters — only show when not searching */}
        {!query && categories.length > 1 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                fontSize: 9, fontFamily: mono, padding: "4px 10px", borderRadius: 3,
                border: filter === cat ? "1px solid #00ff88" : "1px solid #1a1a1a",
                color: filter === cat ? "#00ff88" : "#444",
                background: filter === cat ? "#00ff8810" : "none",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ width: 20, height: 20, border: "2px solid #1a1a1a", borderTopColor: "#00ff88", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 11, color: "#444", fontFamily: mono }}>
              {query ? `searching_for("${query}")...` : "loading_credentials..."}
            </p>
          </div>
        ) : error || filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontSize: 11, color: "#444", fontFamily: mono, marginBottom: 16 }}>
              {query ? `no results for "${query}"` : "no credentials yet."}
            </p>
            {!query && (
              <a href="/" style={{ fontSize: 10, color: "#00ff88", fontFamily: mono, textDecoration: "none", border: "1px solid #00ff8830", borderRadius: 6, padding: "8px 16px" }}>
                submit_first_project()
              </a>
            )}
          </div>
        ) : (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 9, color: "#333", fontFamily: mono, marginBottom: 12 }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.map((c) => {
                const color = scoreColor(c.analysis.score);
                const date = new Date(c.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const shortWallet = `${c.walletAddress.slice(0, 6)}...${c.walletAddress.slice(-4)}`;
                return (
                  <a key={c.id} href={`/verify/${c.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ border: "1px solid #1a1a1a", borderRadius: 8, padding: 14, display: "flex", alignItems: "flex-start", gap: 12, transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#00ff8840"; (e.currentTarget as HTMLDivElement).style.background = "#00ff8805"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                    >
                      <div style={{ width: 44, height: 44, flexShrink: 0, position: "relative" }}>
                        <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 44 44">
                          <circle cx="22" cy="22" r="17" fill="none" stroke="#111" strokeWidth="4" />
                          <circle cx="22" cy="22" r="17" fill="none" stroke={color} strokeWidth="4"
                            strokeDasharray={2 * Math.PI * 17}
                            strokeDashoffset={2 * Math.PI * 17 - (c.analysis.score / 100) * 2 * Math.PI * 17}
                            strokeLinecap="round" />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: mono }}>{c.analysis.score}</span>
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: mono }}>{c.analysis.credentialTitle}</span>
                          <span style={{ fontSize: 9, color: "#333", fontFamily: mono, flexShrink: 0 }}>{date}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#444", fontFamily: mono, marginTop: 2 }}>
                          {c.repo.name} · <a href={`/profile/${c.walletAddress}`} onClick={(e) => e.stopPropagation()} style={{ color: "#555", textDecoration: "none" }}>{shortWallet}</a>
                        </div>
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
        )}
      </div>
    </main>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 11, color: "#444", fontFamily: "JetBrains Mono, monospace" }}>loading...</p>
      </main>
    }>
      <ExploreContent />
    </Suspense>
  );
}
