import Groq from "groq-sdk";
import { NextRequest } from "next/server";
import { auth } from "@/auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

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
    (headers as Record<string, string>).Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const [repoRes, contentsRes, languagesRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }),
  ]);
  if (!repoRes.ok) throw new Error(`GitHub repo not found: ${repoRes.statusText}`);
  const [repoData, contentsData, languagesData] = await Promise.all([repoRes.json(), contentsRes.json(), languagesRes.json()]);
  let readme = "";
  const readmeFile = Array.isArray(contentsData) ? contentsData.find((f: { name: string }) => f.name.toLowerCase().startsWith("readme")) : null;
  if (readmeFile?.download_url) { const r = await fetch(readmeFile.download_url); if (r.ok) readme = await r.text(); }
  const configFiles = ["package.json", "hardhat.config.js", "foundry.toml", "Cargo.toml"];
  const configContents: Record<string, string> = {};
  await Promise.all(configFiles.map(async (name) => {
    const file = Array.isArray(contentsData) ? contentsData.find((f: { name: string }) => f.name === name) : null;
    if (file?.download_url) { const res = await fetch(file.download_url); if (res.ok) configContents[name] = await res.text(); }
  }));
  return {
    name: repoData.name,
    description: repoData.description || "",
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    topics: repoData.topics || [],
    languages: languagesData,
    files: Array.isArray(contentsData) ? contentsData.map((f: { name: string; type: string }) => ({ name: f.name, type: f.type })) : [],
    readme: readme.slice(0, 3000),
    configContents,
    // Fork status, straight from GitHub's repo API — the field was already
    // being returned, just not read until now.
    isFork: Boolean(repoData.fork),
    parentFullName: repoData.parent?.full_name ?? null,
  };
}

// Fetches up to 300 recent commits and computes what percentage are
// attributed to the given (server-verified) GitHub login. This is a
// lightweight heuristic, not a full git-blame analysis — squashed commits,
// co-authors, and private commit emails can all affect accuracy.
async function fetchContributionPercentage(
  owner: string,
  repo: string,
  githubUsername: string | null
): Promise<{ contributionPercentage: number | null; totalCommitsAnalyzed: number }> {
  if (!githubUsername) {
    return { contributionPercentage: null, totalCommitsAnalyzed: 0 };
  }

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    (headers as Record<string, string>).Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    // 3 pages x 100 = up to 300 commits. Good enough signal without an
    // expensive full-history walk on large repos.
    const pages = await Promise.all(
      [1, 2, 3].map((page) =>
        fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=100&page=${page}`, { headers })
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
      )
    );

    const commits = pages.flat() as Array<{ author: { login?: string } | null }>;
    if (commits.length === 0) {
      return { contributionPercentage: null, totalCommitsAnalyzed: 0 };
    }

    const attributed = commits.filter(
      (c) => c.author?.login?.toLowerCase() === githubUsername.toLowerCase()
    ).length;

    return {
      contributionPercentage: Math.round((attributed / commits.length) * 100),
      totalCommitsAnalyzed: commits.length,
    };
  } catch {
    return { contributionPercentage: null, totalCommitsAnalyzed: 0 };
  }
}

function buildPrompt(
  data: Awaited<ReturnType<typeof fetchGitHubData>>,
  extraContext: string,
  githubUsername: string | null,
  contributionPercentage: number | null
) {
  const identityContext = githubUsername
    ? `SUBMITTER: Verified GitHub identity "${githubUsername}"${
        contributionPercentage !== null
          ? ` — attributed to ~${contributionPercentage}% of recent commits on this repo.`
          : " — contribution percentage could not be determined (private commit emails or squashed history)."
      }${data.isFork ? ` NOTE: This repository is a FORK of ${data.parentFullName ?? "another repository"}. Weigh original contribution heavily; do not reward forked code that isn't meaningfully modified.` : ""}`
    : `SUBMITTER: Not GitHub-authenticated. Treat this submission as unverified — do not assume the submitter wrote this code.`;

  return `You are an expert technical evaluator for a blockchain/web3 builder credentialing system.

${identityContext}

REPOSITORY DATA:
Name: ${data.name}
Description: ${data.description}
Stars: ${data.stars} | Forks: ${data.forks}
Topics: ${data.topics.join(", ")}
Languages: ${JSON.stringify(data.languages)}
Root files: ${data.files.map((f) => f.name).join(", ")}
README: ${data.readme || "No README found."}
CONFIG FILES: ${Object.entries(data.configContents).map(([k, v]) => `--- ${k} ---\n${v.slice(0, 800)}`).join("\n\n")}
EXTRA CONTEXT: ${extraContext || "None provided."}

Return ONLY valid JSON with this exact shape:
{
  "skills": ["skill1", "skill2"],
  "levels": { "skill1": "Beginner|Intermediate|Advanced" },
  "score": <0-100>,
  "category": "DeFi|Tooling|NFT|DAO|Frontend|Smart Contracts|Full Stack|Infrastructure|Other",
  "summary": "<2-3 sentences>",
  "highlights": ["<achievement 1>", "<achievement 2>", "<achievement 3>"],
  "credentialTitle": "<short title>",
  "flags": ["<concern>"],
  "radarScores": { "complexity": <0-100>, "documentation": <0-100>, "testing": <0-100>, "security": <0-100>, "innovation": <0-100>, "completeness": <0-100> }
}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { githubUrl, contractAddress, liveUrl, extraContext } = body;
  const encoder = new TextEncoder();

  // Server-verified identity — never trust a client-supplied username here.
  const session = await auth();
  const githubUsername = (session as { githubUsername?: string } | null)?.githubUsername ?? null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`));
      };
      try {
        if (!githubUrl) throw new Error("GitHub URL is required.");
        const parsed = parseGitHubUrl(githubUrl);
        if (!parsed) throw new Error("Invalid GitHub URL.");

        send("log", { message: "$ initializing analysis...", type: "system" });
        await new Promise(r => setTimeout(r, 300));

        if (githubUsername) {
          send("log", { message: `✓ verified submitter: @${githubUsername}`, type: "success" });
        } else {
          send("log", { message: "⚠ no GitHub identity connected — submission will be unverified", type: "warn" });
        }
        await new Promise(r => setTimeout(r, 200));

        send("log", { message: `→ connecting to github.com/${parsed.owner}/${parsed.repo}`, type: "info" });
        await new Promise(r => setTimeout(r, 400));
        send("log", { message: "→ fetching repository metadata...", type: "info" });

        const repoData = await fetchGitHubData(parsed.owner, parsed.repo);

        send("log", { message: `✓ repo found: ${repoData.name} (★${repoData.stars})`, type: "success" });
        await new Promise(r => setTimeout(r, 200));

        if (repoData.isFork) {
          send("log", { message: `⚠ this repo is a fork of ${repoData.parentFullName}`, type: "warn" });
          await new Promise(r => setTimeout(r, 200));
        }

        const langs = Object.keys(repoData.languages);
        if (langs.length > 0) { send("log", { message: `→ languages detected: ${langs.join(", ")}`, type: "info" }); await new Promise(r => setTimeout(r, 200)); }
        if (repoData.readme) { send("log", { message: "✓ README found — reading documentation...", type: "success" }); await new Promise(r => setTimeout(r, 200)); }
        else { send("log", { message: "⚠ no README found", type: "warn" }); await new Promise(r => setTimeout(r, 200)); }
        const configFound = Object.keys(repoData.configContents);
        if (configFound.length > 0) { send("log", { message: `✓ config files: ${configFound.join(", ")}`, type: "success" }); await new Promise(r => setTimeout(r, 200)); }
        send("log", { message: `→ ${repoData.files.length} files in root directory`, type: "info" });
        await new Promise(r => setTimeout(r, 300));

        send("log", { message: "→ analyzing commit authorship...", type: "info" });
        const { contributionPercentage, totalCommitsAnalyzed } = await fetchContributionPercentage(
          parsed.owner, parsed.repo, githubUsername
        );
        if (contributionPercentage !== null) {
          send("log", { message: `✓ ~${contributionPercentage}% of last ${totalCommitsAnalyzed} commits attributed to @${githubUsername}`, type: "success" });
        } else if (githubUsername) {
          send("log", { message: "⚠ could not determine contribution percentage", type: "warn" });
        }
        await new Promise(r => setTimeout(r, 200));

        send("log", { message: "$ running AI analysis engine...", type: "system" });
        await new Promise(r => setTimeout(r, 400));
        send("log", { message: "→ evaluating code complexity...", type: "info" });
        await new Promise(r => setTimeout(r, 300));
        send("log", { message: "→ scoring skill levels...", type: "info" });
        await new Promise(r => setTimeout(r, 300));
        send("log", { message: "→ generating credential metadata...", type: "info" });

        const extraContextStr = [contractAddress ? `Deployed contract: ${contractAddress}` : "", liveUrl ? `Live URL: ${liveUrl}` : "", extraContext || ""].filter(Boolean).join("\n");
        const message = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [{ role: "user", content: buildPrompt(repoData, extraContextStr, githubUsername, contributionPercentage) }],
        });
        const rawText = message.choices[0]?.message?.content ?? "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI did not return valid JSON.");
        const analysis = JSON.parse(jsonMatch[0]);

        // Attach verification metadata the AI didn't generate — this comes
        // from real GitHub API data, not the model's discretion.
        analysis.githubVerified = Boolean(githubUsername);
        analysis.githubUsername = githubUsername;
        analysis.isFork = repoData.isFork;
        analysis.contributionPercentage = contributionPercentage;

        send("log", { message: `✓ analysis complete — score: ${analysis.score}/100`, type: "success" });
        await new Promise(r => setTimeout(r, 200));
        send("log", { message: `✓ credential: ${analysis.credentialTitle}`, type: "success" });
        await new Promise(r => setTimeout(r, 200));
        send("log", { message: `✓ skills: ${analysis.skills.join(", ")}`, type: "success" });
        await new Promise(r => setTimeout(r, 200));
        send("log", { message: "$ credential ready to issue →", type: "system" });

        send("result", { success: true, repo: { name: repoData.name, description: repoData.description, stars: repoData.stars, languages: repoData.languages, githubUrl }, analysis });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Analysis failed.";
        send("log", { message: `error: ${msg}`, type: "error" });
        send("error", { message: msg });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
  });
}
