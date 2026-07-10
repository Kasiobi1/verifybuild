// app/api/verify-query/route.ts
//
// Verixa ASP (Agent Service Provider) query endpoint.
// Third-party services (DAO bots, grant dashboards, hackathon discovery tools)
// call this with a wallet address to check verified skill credentials.
//
// Schema confirmed against your real code:
//   - db("verifybuild"), collection "credentials"           <- from credentials/route.ts
//   - documents keyed by `id` (uuid string), not Mongo's `_id`
//   - `walletAddress` (lowercase), `repo.githubUrl`, `repo.name`
//   - `analysis.score` (0-100), `analysis.category`, `analysis.credentialTitle`,
//     `analysis.skills[]`, `analysis.levels` (per-skill map), `analysis.radarScores`
//     (complexity/documentation/testing/security/innovation/completeness)  <- from analyze-stream/route.ts
//
// Note: there's no single overall "skillLevel" in your analysis object — only
// per-skill levels in `analysis.levels`. This endpoint derives an overall level
// from `score` using simple thresholds. Adjust the thresholds below if your UI
// uses different cutoffs anywhere else (e.g. RadarChart.tsx or SubmitForm.tsx).

import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// --- Config -----------------------------------------------------------

const VALID_API_KEYS = new Set(
  (process.env.VERIXA_PARTNER_API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
);

function deriveOverallLevel(score: number): "Beginner" | "Intermediate" | "Advanced" {
  if (score >= 80) return "Advanced";
  if (score >= 50) return "Intermediate";
  return "Beginner";
}

// --- Types --------------------------------------------------------------

interface RadarScores {
  complexity: number;
  documentation: number;
  testing: number;
  security: number;
  innovation: number;
  completeness: number;
}

interface CredentialDoc {
  id: string;
  walletAddress: string;
  repo: {
    githubUrl: string;
    name: string;
  };
  analysis: {
    skills: string[];
    levels: Record<string, string>;
    score: number;
    category: string;
    summary: string;
    highlights: string[];
    credentialTitle: string;
    flags: string[];
    radarScores: RadarScores;
  };
  issuedAt: string;
  status: string;
}

interface VerifyQueryResponse {
  verified: boolean;
  wallet: string;
  confidenceScore: number | null;
  overallSkillLevel: string | null;
  perSkillLevels: Record<string, string> | null;
  credentialId: string | null;
  repoUrl: string | null;
  credentialTitle: string | null;
  category: string | null;
  radarBreakdown: RadarScores | null;
  verifiedAt: string | null;
  reason?: string;
}

// --- Handler --------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Auth
  const apiKey = req.headers.get("x-verixa-api-key");
  if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
    return NextResponse.json(
      { error: "Missing or invalid API key. Include x-verixa-api-key header." },
      { status: 401 }
    );
  }

  // 2. Parse body
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

  // 3. Query
  try {
    const client = await clientPromise;
    const db = client.db("verifybuild");
    const collection = db.collection<CredentialDoc>("credentials");

    const all = await collection
      .find({ walletAddress: wallet })
      .sort({ issuedAt: -1 })
      .toArray();

    // Filter by skill domain against skills[]/category if provided
    const matches =
      skillDomain && skillDomain !== "any"
        ? all.filter(
            (c) =>
              c.analysis?.skills?.some((s) => s.toLowerCase().includes(skillDomain)) ||
              c.analysis?.category?.toLowerCase().includes(skillDomain)
          )
        : all;

    if (matches.length === 0) {
      const response: VerifyQueryResponse = {
        verified: false,
        wallet,
        confidenceScore: null,
        overallSkillLevel: null,
        perSkillLevels: null,
        credentialId: null,
        repoUrl: null,
        credentialTitle: null,
        category: null,
        radarBreakdown: null,
        verifiedAt: null,
        reason: skillDomain
          ? `No verified credential found for wallet in domain "${skillDomain}".`
          : "No verified credential found for this wallet.",
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Highest score wins — a partner asking "is this wallet verified for X"
    // wants the strongest matching claim, not an arbitrary one.
    const best = matches.reduce((top, c) =>
      (c.analysis?.score ?? 0) > (top.analysis?.score ?? 0) ? c : top
    );

    const response: VerifyQueryResponse = {
      verified: true,
      wallet,
      confidenceScore: best.analysis.score,
      overallSkillLevel: deriveOverallLevel(best.analysis.score),
      perSkillLevels: best.analysis.levels ?? null,
      credentialId: best.id,
      repoUrl: best.repo?.githubUrl ?? null,
      credentialTitle: best.analysis.credentialTitle ?? null,
      category: best.analysis.category ?? null,
      radarBreakdown: best.analysis.radarScores ?? null,
      verifiedAt: best.issuedAt,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("verify-query error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// TODO before real (non-hackathon) usage:
// - Per-partner API keys stored in Mongo, not a shared env-var set
// - Rate limiting (e.g. Vercel edge rate limit or Upstash Redis)
// - Consider only returning credentials with status: "issued"/"verified" if
//   your `status` field ("pending" seen in credentials/route.ts) has other states
