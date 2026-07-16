// lib/credentialSignature.ts
//
// Builds the exact message a wallet signs to consent to a specific credential
// being issued to it. Used on both the client (to request the signature) and
// the server (to reconstruct the same string and verify the signature against
// it) — the message MUST be byte-identical on both sides, or verification
// will always fail.

export interface CredentialSignaturePayload {
    walletAddress: string;
    repoUrl: string;
    score: number;
    credentialTitle: string;
    githubUsername?: string | null;
  }
  
  export function buildCredentialSignMessage(payload: CredentialSignaturePayload): string {
    const { walletAddress, repoUrl, score, credentialTitle, githubUsername } = payload;
    return [
      "Verixa — Credential Issuance Consent",
      "",
      `I am issuing a Verixa builder credential to this wallet.`,
      "",
      `Wallet: ${walletAddress.toLowerCase()}`,
      `Repository: ${repoUrl}`,
      `Score: ${score}`,
      `Credential: ${credentialTitle}`,
      `GitHub: ${githubUsername ? `@${githubUsername}` : "unverified"}`,
      "",
      "This signature does not move funds or approve any transaction.",
    ].join("\n");
  }
  