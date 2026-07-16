import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { randomUUID } from "crypto";
import { ethers } from "ethers";
import { buildCredentialSignMessage } from "@/lib/credentialSignature";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, repo, analysis, signature } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required." }, { status: 400 });
    }
    if (!analysis) {
      return NextResponse.json({ error: "Analysis data is required." }, { status: 400 });
    }
    if (!signature) {
      return NextResponse.json({ error: "Wallet signature is required to issue a credential." }, { status: 400 });
    }

    // Reconstruct the exact message the client should have signed, then
    // recover the actual signer address from the signature. If it doesn't
    // match the claimed wallet, someone is trying to issue a credential to
    // a wallet they don't control — reject outright.
    const expectedMessage = buildCredentialSignMessage({
      walletAddress,
      repoUrl: repo?.githubUrl ?? "",
      score: analysis?.score,
      credentialTitle: analysis?.credentialTitle ?? "",
      githubUsername: analysis?.githubUsername ?? null,
    });

    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(expectedMessage, signature);
    } catch {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Signature does not match the claimed wallet address." },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("verifybuild");
    const collection = db.collection("credentials");

    // ── Duplicate check — has this GitHub repo already been issued? ──
    const githubUrl = repo?.githubUrl?.toLowerCase();
    if (githubUrl) {
      const existing = await collection.findOne({
        "repo.githubUrl": { $regex: new RegExp(`^${githubUrl}$`, "i") },
      });
      if (existing) {
        const short = `${existing.walletAddress.slice(0, 6)}...${existing.walletAddress.slice(-4)}`;
        return NextResponse.json({
          error: "already_issued",
          message: `This repository has already been issued to ${short}`,
          existingCredentialId: existing.id,
          existingWallet: existing.walletAddress,
          shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${existing.id}`,
        }, { status: 409 });
      }
    }

    const credential = {
      id: randomUUID(),
      walletAddress: walletAddress.toLowerCase(),
      repo,
      analysis,
      issuedAt: new Date(),
      status: "pending",
      // Signature is stored for auditability — proof this specific wallet
      // consented to this specific credential at issuance time.
      signature,
    };

    await collection.insertOne(credential);

    return NextResponse.json({
      success: true,
      credentialId: credential.id,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${credential.id}`,
    });
  } catch (err: unknown) {
    console.error("[save-credential] error:", err);
    const message = err instanceof Error ? err.message : "Failed to save credential.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    const id = searchParams.get("id");
    const query = searchParams.get("q");

    const client = await clientPromise;
    const db = client.db("verifybuild");
    const collection = db.collection("credentials");

    if (id) {
      const credential = await collection.findOne({ id });
      if (!credential) {
        return NextResponse.json({ error: "Credential not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, credential });
    }

    if (query) {
      const q = query.trim().toLowerCase();
      const all = await collection.find({}).sort({ issuedAt: -1 }).limit(200).toArray();
      const results = all.filter((c) => {
        const walletMatch = c.walletAddress?.toLowerCase().includes(q);
        const repoMatch = c.repo?.name?.toLowerCase().includes(q);
        const titleMatch = c.analysis?.credentialTitle?.toLowerCase().includes(q);
        const skillMatch = c.analysis?.skills?.some((s: string) => s.toLowerCase().includes(q));
        const categoryMatch = c.analysis?.category?.toLowerCase().includes(q);
        return walletMatch || repoMatch || titleMatch || skillMatch || categoryMatch;
      });
      return NextResponse.json({ success: true, credentials: results });
    }

    if (wallet === "all") {
      const credentials = await collection.find({}).sort({ issuedAt: -1 }).limit(50).toArray();
      return NextResponse.json({ success: true, credentials });
    }

    if (wallet) {
      const credentials = await collection
        .find({ walletAddress: wallet.toLowerCase() })
        .sort({ issuedAt: -1 })
        .toArray();
      return NextResponse.json({ success: true, credentials });
    }

    return NextResponse.json({ error: "Provide wallet, id, or q parameter." }, { status: 400 });
  } catch (err: unknown) {
    console.error("[get-credential] error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch credential.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
