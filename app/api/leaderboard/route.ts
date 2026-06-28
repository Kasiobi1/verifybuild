import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("verifybuild");
    const collection = db.collection("credentials");

    const all = await collection.find({}).sort({ issuedAt: -1 }).toArray();

    // Group by wallet address
    const walletMap: Record<string, {
      walletAddress: string;
      scores: number[];
      credentials: typeof all;
    }> = {};

    for (const c of all) {
      const wallet = c.walletAddress.toLowerCase();
      if (!walletMap[wallet]) {
        walletMap[wallet] = { walletAddress: wallet, scores: [], credentials: [] };
      }
      walletMap[wallet].scores.push(c.analysis?.score || 0);
      walletMap[wallet].credentials.push(c);
    }

    // Build leaderboard entries
    const leaderboard = Object.values(walletMap).map((entry) => {
      const scores = entry.scores;
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const topScore = Math.max(...scores);
      const topCred = entry.credentials.find((c) => c.analysis?.score === topScore);
      const allSkills = [...new Set(entry.credentials.flatMap((c) => c.analysis?.skills || []))];

      // Find top category
      const catCount: Record<string, number> = {};
      for (const c of entry.credentials) {
        const cat = c.analysis?.category || "Other";
        catCount[cat] = (catCount[cat] || 0) + 1;
      }
      const topCategory = Object.entries(catCount).sort(([, a], [, b]) => b - a)[0]?.[0] || "Other";

      return {
        walletAddress: entry.walletAddress,
        totalCredentials: entry.credentials.length,
        avgScore,
        topScore,
        topTitle: topCred?.analysis?.credentialTitle || "",
        topCredentialId: topCred?.id || "",
        skills: allSkills.slice(0, 5),
        topCategory,
      };
    });

    // Sort by avg score descending
    leaderboard.sort((a, b) => b.avgScore - a.avgScore);

    return NextResponse.json({ success: true, leaderboard: leaderboard.slice(0, 50) });
  } catch (err: unknown) {
    console.error("[leaderboard] error:", err);
    const message = err instanceof Error ? err.message : "Failed to load leaderboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
