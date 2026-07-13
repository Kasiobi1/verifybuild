#!/usr/bin/env node
// check-x402-supported.mjs
//
// Calls OKX's x402 Facilitator /supported endpoint directly to see the real,
// current list of accepted network/scheme combinations — settles the
// testnet-vs-mainnet-only question definitively instead of guessing from docs.
//
// Usage:
//   OKX_API_KEY=... OKX_SECRET_KEY=... OKX_PASSPHRASE=... node check-x402-supported.mjs

import crypto from "crypto";

const apiKey = process.env.OKX_API_KEY;
const secretKey = process.env.OKX_SECRET_KEY;
const passphrase = process.env.OKX_PASSPHRASE;

if (!apiKey || !secretKey || !passphrase) {
  console.error("Missing OKX_API_KEY / OKX_SECRET_KEY / OKX_PASSPHRASE env vars.");
  process.exit(1);
}

const requestPath = "/api/v6/pay/x402/supported";
const method = "GET";
const body = "";
const timestamp = new Date().toISOString();
const prehash = `${timestamp}${method}${requestPath}${body}`;
const sign = crypto.createHmac("sha256", secretKey).update(prehash).digest("base64");

const res = await fetch(`https://web3.okx.com${requestPath}`, {
  method,
  headers: {
    "OK-ACCESS-KEY": apiKey,
    "OK-ACCESS-SIGN": sign,
    "OK-ACCESS-PASSPHRASE": passphrase,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "Content-Type": "application/json",
  },
});

const json = await res.json();
console.log(JSON.stringify(json, null, 2));
