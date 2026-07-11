// app/api/verify-query/route.ts
//
// Verixa ASP (Agent Service Provider) query endpoint.
//
// Supports TWO auth paths, so existing integrations (your dao-bot-demo.mjs
// script) keep working while adding real pay-per-call support:
//
//   1. Pre-arranged partner API key (x-verixa-api-key header) — unchanged
//      from before, free for whitelisted partners.
//   2. x402 micropayment (X-PAYMENT header) — no API key needed. First call
//      without X-PAYMENT gets a 402 challenge; caller signs an EIP-3009
//      authorization with their own wallet, retries with X-PAYMENT set,
//      and pays $0.01 (USDC on OKX X Layer) per successful query.

import { NextRequest, NextResponse } from "next/server";
import { queryCredential } from "@/lib/verixaQuery";
import {
  buildPaymentRequirements,
  verifyPayment,
  settlePayment,
  decodePaymentHeader,
} from "@/lib/x402";

const VALID_API_KEYS = new Set(
  (process.env.VERIXA_PARTNER_API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
);

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-verixa-api-key");
  const paymentHeader = req.headers.get("x-payment");

  const hasValidApiKey = !!apiKey && VALID_API_KEYS.has(apiKey);

  // Neither auth path present yet -> issue the x402 payment challenge.
  if (!hasValidApiKey && !paymentHeader) {
    try {
      const paymentRequirements = buildPaymentRequirements();
      return NextResponse.json(
        {
          error: "payment_required",
          message: "Include an x-verixa-api-key header, or pay per call via x402 (see accepts).",
          accepts: [paymentRequirements],
        },
        { status: 402 }
      );
    } catch (err) {
      console.error("verify-query: failed to build payment requirements:", err);
      return NextResponse.json(
        { error: "Missing or invalid API key, and payment configuration unavailable." },
        { status: 401 }
      );
    }
  }

  // Payment path: verify + settle before doing any work.
  if (!hasValidApiKey && paymentHeader) {
    try {
      const paymentRequirements = buildPaymentRequirements();
      const paymentPayload = decodePaymentHeader(paymentHeader);

      const verifyResult = await verifyPayment(paymentPayload, paymentRequirements);
      if (!verifyResult.isValid) {
        return NextResponse.json(
          {
            error: "payment_invalid",
            reason: verifyResult.invalidReason,
            message: verifyResult.invalidMessage,
          },
          { status: 402 }
        );
      }

      const settleResult = await settlePayment(paymentPayload, paymentRequirements);
      if (!settleResult.success) {
        return NextResponse.json(
          {
            error: "payment_settlement_failed",
            reason: settleResult.errorReason,
            message: settleResult.errorMessage,
          },
          { status: 402 }
        );
      }

      // Payment accepted for settlement — proceed to deliver the resource.
      // (settleResult only confirms intake, not final on-chain confirmation —
      // matching OKX's own documented behavior for this endpoint.)
    } catch (err) {
      console.error("verify-query: payment verification error:", err);
      return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
    }
  }

  // Both auth paths passed (or API key was valid) — do the actual query.
  let body: { wallet?: string; skillDomain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const wallet = body.wallet?.toLowerCase().trim();
  const skillDomain = body.skillDomain?.toLowerCase().trim();

  if (!wallet || !/^0x[a-f0-9]{40}$/.test(wallet)) {
    return NextResponse.json(
      { error: "Valid EVM wallet address is required." },
      { status: 400 }
    );
  }

  try {
    const result = await queryCredential(wallet, skillDomain);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("verify-query error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// TODO before real (non-hackathon) usage:
// - Per-partner API keys stored in Mongo, not a shared env-var set
// - Rate limiting
// - Poll /settle/status before fully trusting settlement (currently trusts
//   intake success, matching OKX's own documented Seller pattern)
