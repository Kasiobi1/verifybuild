# [VERIXA] — AI-Verified On-Chain Credentials

> Your code is your credential. Submit a GitHub repo. AI scores the work. Credential issued on-chain.

Built during **HACD Labs Incubator Season 2** in 7 days.

🔗 **Live:** https://verifybuild-gules.vercel.app

---

## What is Verixa?

Verixa solves a real problem — fake resumes and unverifiable skill claims are everywhere in web3 hiring and DAO contributor vetting. Anyone can say they're a developer. Verixa lets the code prove it.

**The flow:**
```
Submit GitHub repo
       ↓
AI analyzes the actual code
(structure, languages, complexity, docs, tests)
       ↓
Skill score generated (0–100)
       ↓
Verifiable credential issued to wallet address
       ↓
Shareable, permanent, on-chain
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **AI Engine** | Groq API — llama-3.3-70b-versatile |
| **Blockchain** | HACD Labs — Hacash ecosystem |
| **Streaming** | Server-Sent Events (SSE) — real-time analysis log |
| **Database** | MongoDB Atlas |
| **Wallet** | MetaMask via ethers.js |
| **GitHub Analysis** | GitHub REST API |
| **Deployment** | Vercel |
---

## Features

- **AI Analysis** — reads your repo's README, languages, config files, and file structure
- **Skill Scoring** — 0-100 score with skill level breakdown (Beginner / Intermediate / Advanced)
- **Radar Chart** — 6-dimensional skill visualization (complexity, documentation, testing, security, innovation, completeness)
- **Streaming Log** — real-time terminal-style analysis output via SSE
- **On-Chain Credentials** — verifiable credential saved and tied to wallet address
- **Shareable URL** — public credential page at `/verify/[id]`
- **Builder Profiles** — public profile at `/profile/[wallet]`
- **Leaderboard** — top builders ranked by score
- **Explore & Search** — search by skill, wallet, project name, or credential title
- **Duplicate Protection** — each GitHub repo can only be claimed once
- **Mobile First** — terminal UI with bottom navigation

---

## Project Structure

```
verifybuild/
├── app/
│   ├── page.tsx                    # Landing page + submit form
│   ├── verify/[id]/page.tsx        # Public credential page
│   ├── profile/[wallet]/page.tsx   # Builder profile page
│   ├── explore/page.tsx            # Explore + search all credentials
│   ├── leaderboard/page.tsx        # Top builders leaderboard
│   ├── connect/page.tsx            # Wallet connect page
│   └── api/
│       ├── analyze-stream/         # SSE streaming AI analysis
│       ├── credentials/            # CRUD for credentials (MongoDB)
│       └── leaderboard/            # Leaderboard aggregation
├── components/
│   ├── SubmitForm.tsx              # Main form + streaming log + result card
│   ├── RadarChart.tsx              # SVG radar chart component
│   ├── WalletConnect.tsx           # MetaMask connection
│   └── BottomNav.tsx               # Mobile bottom navigation
├── hooks/
│   └── useWallet.ts                # MetaMask wallet hook
└── lib/
    └── mongodb.ts                  # MongoDB connection utility
```

---

## Environment Variables

```env
GROQ_API_KEY=               # Groq API key
GITHUB_TOKEN=               # GitHub personal access token (optional, increases rate limit)
MONGODB_URI=                # MongoDB Atlas connection string
NEXT_PUBLIC_APP_URL=        # Your deployment URL
```

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Kasiobi1/verifybuild
cd verifybuild

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your keys to .env.local

# Run locally
npm run dev
```

---

## Token — Verixa (VRX)

Verixa is launching as a Stack Token on HACD Labs.

| Parameter | Value |
|---|---|
| Name | Verixa |
| Ticker | VRX |
| Type | HYBRID (FT + NFT) |
| Total Supply | 1,000,000 VRX |
| Lots | 100 |
| Stack Cost | 50 HAC per HACD |

**VRX utility:** credential access, governance, verifier rewards, organization staking.

---

## Built With

- [Next.js](https://nextjs.org)
- [Groq](https://groq.com)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [HACD Labs](https://hacd.it)
- [ethers.js](https://ethers.org)

---

*Built by [@Kasiobi1](https://github.com/Kasiobi1) — HACD Labs Incubator Season 2*