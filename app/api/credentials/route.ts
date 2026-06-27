import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, repo, analysis } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required." },
        { status: 400 }
      );
    }

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis data is required." },
        { status: 400 }
      );
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
      status: "pending", // pending → issued once HACD mints
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

    const client = await clientPromise;
    const db = client.db("verifybuild");
    const collection = db.collection("credentials");

    if (id) {
      // Fetch single credential by ID
      const credential = await collection.findOne({ id });
      if (!credential) {
        return NextResponse.json(
          { error: "Credential not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, credential });
    }

    if (wallet) {
      // Fetch all credentials for a wallet
      const credentials = await collection
        .find({ walletAddress: wallet.toLowerCase() })
        .sort({ issuedAt: -1 })
        .toArray();
      return NextResponse.json({ success: true, credentials });
    }

    return NextResponse.json(
      { error: "Provide wallet or id parameter." },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("[get-credential] error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch credential.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}