import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// ── GitHub helpers ────────────────────────────────────────────────────────────

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/^\//, "").split("/");
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
  } catch {}
  return null;
}

async function fetchGitHubData(owner: string, repo: string) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    (headers as Record<string, string>).Authorization =
      `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const [repoRes, contentsRes, languagesRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers,
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers,
    }),
  ]);

  if (!repoRes.ok)
    throw new Error(`GitHub repo not found: ${repoRes.statusText}`);

  const [repoData, contentsData, languagesData] = await Promise.all([
    repoRes.json(),
    contentsRes.json(),
    languagesRes.json(),
  ]);

  // Fetch README if it exists
  let readme = "";
  const readmeFile = Array.isArray(contentsData)
    ? contentsData.find((f: { name: string }) =>
        f.name.toLowerCase().startsWith("readme")
      )
    : null;

  if (readmeFile?.download_url) {
    const readmeRes = await fetch(readmeFile.download_url);
    if (readmeRes.ok) readme = await readmeRes.text();
  }

  // Fetch package.json or Cargo.toml or hardhat.config for extra context
  const configFiles = ["package.json", "hardhat.config.js", "foundry.toml", "Cargo.toml"];
  const configContents: Record<string, string> = {};

  await Promise.all(
    configFiles.map(async (name) => {
      const file = Array.isArray(contentsData)
        ? contentsData.find((f: { name: string }) => f.name === name)
        : null;
      if (file?.download_url) {
        const res = await fetch(file.download_url);
        if (res.ok) configContents[name] = await res.text();
      }
    })
  );

  return {
    name: repoData.name,
    description: repoData.description || "",
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    topics: repoData.topics || [],
    createdAt: repoData.created_at,
    updatedAt: repoData.updated_at,
    languages: languagesData,
    files: Array.isArray(contentsData)
      ? contentsData.map((f: { name: string; type: string }) => ({
          name: f.name,
          type: f.type,
        }))
      : [],
    readme: readme.slice(0, 3000), // cap to avoid token overflow
    configContents,
  };
}

// ── Scoring prompt ────────────────────────────────────────────────────────────

function buildPrompt(data: Awaited<ReturnType<typeof fetchGitHubData>>, extraContext: string) {
  return `You are an expert technical evaluator for a blockchain/web3 builder credentialing system. Analyze this GitHub repository and produce a structured skill assessment.

REPOSITORY DATA:
Name: ${data.name}
Description: ${data.description}
Stars: ${data.stars} | Forks: ${data.forks}
Topics: ${data.topics.join(", ")}
Languages: ${JSON.stringify(data.languages)}
Root files: ${data.files.map((f) => f.name).join(", ")}

README (first 3000 chars):
${data.readme || "No README found."}

CONFIG FILES:
${Object.entries(data.configContents)
  .map(([k, v]) => `--- ${k} ---\n${v.slice(0, 800)}`)
  .join("\n\n")}

EXTRA CONTEXT FROM SUBMITTER:
${extraContext || "None provided."}

TASK:
Return ONLY a valid JSON object (no markdown, no explanation) with this exact shape:

{
  "skills": ["skill1", "skill2"],
  "levels": { "skill1": "Beginner|Intermediate|Advanced", "skill2": "..." },
  "score": <integer 0-100>,
  "category": "DeFi|Tooling|NFT|DAO|Frontend|Smart Contracts|Full Stack|Infrastructure|Other",
  "summary": "<2-3 sentence human-readable summary of what was built and skill demonstrated>",
  "highlights": ["<specific technical achievement 1>", "<specific technical achievement 2>", "<specific technical achievement 3>"],
  "credentialTitle": "<short title for the on-chain credential e.g. 'Advanced Solidity Developer'>",
  "flags": ["<any concerns e.g. 'No tests found', 'Minimal commits'>"]
}

SCORING GUIDE:
- 80-100: Production-quality, complex architecture, well-documented, tested
- 60-79: Solid implementation, real functionality, some gaps
- 40-59: Working prototype, shows understanding, incomplete
- 20-39: Early stage, basic implementation
- 0-19: Minimal work, placeholder, or unrelated

Be honest and specific. The credential will be on-chain and permanently visible.`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { githubUrl, contractAddress, liveUrl, extraContext } = body;

    if (!githubUrl) {
      return NextResponse.json(
        { error: "GitHub URL is required." },
        { status: 400 }
      );
    }

    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Use https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    // Fetch repo data
    const repoData = await fetchGitHubData(parsed.owner, parsed.repo);

    // Build context string
    const extraContextStr = [
      contractAddress ? `Deployed contract: ${contractAddress}` : "",
      liveUrl ? `Live URL: ${liveUrl}` : "",
      extraContext || "",
    ]
      .filter(Boolean)
      .join("\n");

    // Call Claude
    const message = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [{ role: "user", content: buildPrompt(repoData, extraContextStr) }],
      });
      const rawText = message.choices[0]?.message?.content ?? "";

    // Parse JSON from Claude's response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return valid JSON.");
    }
    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      repo: {
        name: repoData.name,
        description: repoData.description,
        stars: repoData.stars,
        languages: repoData.languages,
        githubUrl,
      },
      analysis,
    });
  } catch (err: unknown) {
    console.error("[analyze] error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
