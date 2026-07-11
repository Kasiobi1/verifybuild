// lib/verixaQuery.ts
//
// Shared credential-lookup logic. Used by:
//   - app/api/verify-query/route.ts   (real ASP endpoint, requires API key)
//   - app/api/demo-dao-query/route.ts (public demo route, no key — for the live demo page)
//
// Keeping this in one place means the demo page is provably running the same
// logic as the real ASP endpoint, not a fake/mocked version.

import clientPromise from "@/lib/mongodb";

export interface RadarScores {
  complexity: number;
  documentation: number;
  testing: number;
  security: number;
  innovation: number;
  completeness: number;
}

export interface CredentialDoc {
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

export interface VerixaQueryResult {
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

export function deriveOverallLevel(score: number): "Beginner" | "Intermediate" | "Advanced" {
  if (score >= 80) return "Advanced";
  if (score >= 50) return "Intermediate";
  return "Beginner";
}

export async function queryCredential(
  wallet: string,
  skillDomain?: string
): Promise<VerixaQueryResult> {
  const client = await clientPromise;
  const db = client.db("verifybuild");
  const collection = db.collection<CredentialDoc>("credentials");

  const all = await collection
    .find({ walletAddress: wallet })
    .sort({ issuedAt: -1 })
    .toArray();

  const matches =
    skillDomain && skillDomain !== "any"
      ? all.filter(
          (c) =>
            c.analysis?.skills?.some((s) => s.toLowerCase().includes(skillDomain)) ||
            c.analysis?.category?.toLowerCase().includes(skillDomain)
        )
      : all;

  if (matches.length === 0) {
    return {
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
  }

  const best = matches.reduce((top, c) =>
    (c.analysis?.score ?? 0) > (top.analysis?.score ?? 0) ? c : top
  );

  return {
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
}
