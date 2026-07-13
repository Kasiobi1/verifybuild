// lib/x402.ts
//
// x402 (Agent Payments Protocol, "exact" scheme) seller-side helper for
// Verixa's verify-query ASP endpoint. Implements the raw OKX v6 HTTP API
// directly (not the Express-based @okxweb3/x402-express SDK, which doesn't
// fit Next.js App Router route handlers).
//
// Flow:
//   1. Caller hits verify-query with no X-PAYMENT header -> we return 402
//      with a PaymentRequirements challenge (buildPaymentRequirements).
//   2. Caller signs an EIP-3009 authorization with their own EVM wallet,
//      base64-encodes the resulting PaymentPayload, retries with the
//      X-PAYMENT header set.
//   3. We call /verify, then /settle, against OKX's Facilitator.
//   4. On success, we return the actual resource (the credential data).

import crypto from "crypto";

const OKX_BASE_URL = "https://web3.okx.com";
const X402_PATH_PREFIX = "/api/v6/pay/x402";

// X Layer (CAIP-2 eip155:196). USDT0 — X Layer's canonical USDT (per OKX,
// the old wrapped USDT address is being phased out in favor of USDT0).
// Matches the marketplace listing, which denominates the fee in USDT.
const NETWORK = "eip155:196";
const USDT0_ASSET = "0x779Ded0c9e1022225f8E0630b35a9b54bE713736";
const USDT0_DECIMALS = 6; // standard for USDT-family tokens — VERIFY against the contract's decimals() on OKLink before relying on this

// Price per verify-query call. $0.01 keeps this genuinely "pay-per-call"
// cheap, matching the docs' own example pricing.
const PRICE_USD = 0.01;

function priceToAtomicUnits(usd: number, decimals: number): string {
  return Math.round(usd * 10 ** decimals).toString();
}

interface OkxCreds {
  apiKey: string;
  secretKey: string;
  passphrase: string;
}

function getOkxCreds(): OkxCreds {
  const apiKey = process.env.OKX_API_KEY;
  const secretKey = process.env.OKX_SECRET_KEY;
  const passphrase = process.env.OKX_PASSPHRASE;
  if (!apiKey || !secretKey || !passphrase) {
    throw new Error("Missing OKX_API_KEY / OKX_SECRET_KEY / OKX_PASSPHRASE env vars.");
  }
  return { apiKey, secretKey, passphrase };
}

// Signs a request per OKX's standard scheme:
// Base64(HMAC-SHA256(secretKey, timestamp + method + requestPath + body))
function signRequest(
  creds: OkxCreds,
  method: "GET" | "POST",
  requestPath: string,
  body: string
) {
  const timestamp = new Date().toISOString();
  const prehash = `${timestamp}${method}${requestPath}${body}`;
  const sign = crypto
    .createHmac("sha256", creds.secretKey)
    .update(prehash)
    .digest("base64");

  return {
    "OK-ACCESS-KEY": creds.apiKey,
    "OK-ACCESS-SIGN": sign,
    "OK-ACCESS-PASSPHRASE": creds.passphrase,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "Content-Type": "application/json",
  };
}

export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: { name?: string; version?: string };
}

// The challenge we hand back in a 402 response. resourceUrl is echoed back
// so the buyer's payload can reference exactly which resource it's paying for.
export function buildPaymentRequirements(): PaymentRequirements {
  const payTo = process.env.VERIXA_PAYOUT_WALLET;
  if (!payTo) {
    throw new Error("Missing VERIXA_PAYOUT_WALLET env var (your wallet to receive payments).");
  }
  return {
    scheme: "exact",
    network: NETWORK,
    amount: priceToAtomicUnits(PRICE_USD, USDT0_DECIMALS),
    asset: USDT0_ASSET,
    payTo,
    maxTimeoutSeconds: 60,
    // Confirmed via OKLink contract read (name() call): "USD₮0" — note the
    // special ₮ character, not a plain "T". version is NOT exposed as a
    // public getter on this contract; "1" is the common default for
    // EIP-3009 tokens but is UNCONFIRMED — revisit first if signing fails.
    extra: { name: "USD₮0", version: "1" },
  };
}

export interface VerifyResult {
  isValid: boolean;
  invalidReason?: string;
  invalidMessage?: string;
  payer?: string;
}

export interface SettleResult {
  success: boolean;
  errorReason?: string;
  errorMessage?: string;
  payer?: string;
  transaction?: string;
  network?: string;
  status?: string;
}

async function callOkxX402<T>(
  endpoint: "verify" | "settle",
  payload: unknown
): Promise<T> {
  const creds = getOkxCreds();
  const requestPath = `${X402_PATH_PREFIX}/${endpoint}`;
  const body = JSON.stringify(payload);
  const headers = signRequest(creds, "POST", requestPath, body);

  const res = await fetch(`${OKX_BASE_URL}${requestPath}`, {
    method: "POST",
    headers,
    body,
  });

  const json = await res.json();
  if (json.code !== "0") {
    throw new Error(`OKX x402 ${endpoint} error (${json.code}): ${json.msg}`);
  }
  return json.data as T;
}

export async function verifyPayment(
  paymentPayload: unknown,
  paymentRequirements: PaymentRequirements
): Promise<VerifyResult> {
  return callOkxX402<VerifyResult>("verify", {
    x402Version: 2,
    paymentPayload,
    paymentRequirements,
  });
}

export async function settlePayment(
  paymentPayload: unknown,
  paymentRequirements: PaymentRequirements
): Promise<SettleResult> {
  return callOkxX402<SettleResult>("settle", {
    x402Version: 2,
    paymentPayload,
    paymentRequirements,
  });
}

// Decodes the base64 X-PAYMENT header the buyer sends back after signing.
export function decodePaymentHeader(headerValue: string): unknown {
  const json = Buffer.from(headerValue, "base64").toString("utf-8");
  return JSON.parse(json);
}
