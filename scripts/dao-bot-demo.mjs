#!/usr/bin/env node
// scripts/dao-bot-demo.mjs
//
// Standalone script simulating a real third-party integration — e.g. a DAO's
// onboarding bot — calling Verixa's authenticated ASP endpoint directly.
// This hits the REAL /api/verify-query route (API-key gated), not the public
// demo route used by the in-app /demo/dao-check page. Use this to prove the
// actual ASP contract works end-to-end for judges or partners.
//
// Usage:
//   VERIXA_API_URL=https://your-app.vercel.app \
//   VERIXA_API_KEY=demo-key-123 \
//   node scripts/dao-bot-demo.mjs 0xYourWalletAddress [skillDomain]

const apiUrl = process.env.VERIXA_API_URL;
const apiKey = process.env.VERIXA_API_KEY;
const wallet = process.argv[2];
const skillDomain = process.argv[3] || "any";

if (!apiUrl || !apiKey) {
  console.error("Missing VERIXA_API_URL or VERIXA_API_KEY environment variables.");
  process.exit(1);
}
if (!wallet) {
  console.error("Usage: node scripts/dao-bot-demo.mjs <wallet_address> [skillDomain]");
  process.exit(1);
}

async function main() {
  console.log(`[dao-bot] checking contributor ${wallet} (domain: ${skillDomain})...`);

  const res = await fetch(`${apiUrl}/api/verify-query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-verixa-api-key": apiKey,
    },
    body: JSON.stringify({ wallet, skillDomain }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`[dao-bot] request failed (${res.status}):`, data.error ?? data);
    process.exit(1);
  }

  if (data.verified) {
    console.log(`[dao-bot] ✓ verified — "${data.credentialTitle}" (${data.category})`);
    console.log(`[dao-bot]   confidence score: ${data.confidenceScore}/100 — ${data.overallSkillLevel}`);
    console.log(`[dao-bot]   repo: ${data.repoUrl}`);
    console.log(`[dao-bot] decision → APPROVE`);
  } else {
    console.log(`[dao-bot] ✗ not verified — ${data.reason}`);
    console.log(`[dao-bot] decision → DENY / manual review`);
  }
}

main().catch((err) => {
  console.error("[dao-bot] unexpected error:", err);
  process.exit(1);
});
