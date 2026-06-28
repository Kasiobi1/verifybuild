import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, repo, analysis } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required." }, { status: 400 });
    }
    if (!analysis) {
      return NextResponse.json({ error: "Analysis data is required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("verifybuild");
    const collection = db.collection("credentials");

    const credential = {
      id: randomUUID(),
      walletAddress: walletAddress.toLowerCase(),
      repo,
      analysis,
      issuedAt: new Date(),
      status: "pending",
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

    // Single credential by ID
    if (id) {
      const credential = await collection.findOne({ id });
      if (!credential) {
        return NextResponse.json({ error: "Credential not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, credential });
    }

    // Search across skills, wallet, repo name, credential title
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

    // All credentials for explore page
    if (wallet === "all") {
      const credentials = await collection
        .find({})
        .sort({ issuedAt: -1 })
        .limit(50)
        .toArray();
      return NextResponse.json({ success: true, credentials });
    }

    // All credentials for a specific wallet
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
