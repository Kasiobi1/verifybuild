// app/api/demo-dao-query/route.ts
//
// Public, unauthenticated version of verify-query, used ONLY by the
// /demo/dao-check demo page so it can call it directly from the browser
// without exposing a real partner API key client-side.
//
// This intentionally has no auth — do not use this pattern for the real
// ASP endpoint. It exists purely so hackathon judges can click a button
// and see a live query happen, without needing to hold an API key.

import { NextRequest, NextResponse } from "next/server";
import { queryCredential } from "@/lib/verixaQuery";

export async function POST(req: NextRequest) {
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
    console.error("demo-dao-query error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
