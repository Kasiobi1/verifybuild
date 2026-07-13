// lib/x402Buyer.ts
//
// Buyer-side x402 signing, run in the browser against the user's connected
// wallet (OKX Wallet or MetaMask, whichever is active via useWallet).
//
// Given a PaymentRequirements challenge (from a 402 response), this builds
// and signs an EIP-3009 "transferWithAuthorization" message — the same
// signature format USDC natively supports for gasless transfers — then
// packages it into the base64 X-PAYMENT header the seller expects.

import { ethers } from "ethers";

export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: { name?: string; version?: string };
}

interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

function getInjectedProvider(walletKind: "metamask" | "okx"): EIP1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { ethereum?: EIP1193Provider; okxwallet?: EIP1193Provider };
  return walletKind === "okx" ? w.okxwallet : w.ethereum;
}

// X Layer's EVM chain ID (196) as hex, required by wallet_switchEthereumChain.
const X_LAYER_CHAIN_ID_HEX = "0xc4";

// Ensures the wallet's actual active network is X Layer before we ask it to
// sign anything — otherwise wallets like OKX Wallet show a confusing
// confirmation screen (wrong network label, "Unknown" token) because the
// active chain doesn't match the chainId embedded in the EIP-712 domain.
async function ensureXLayerNetwork(injected: EIP1193Provider): Promise<void> {
  try {
    await injected.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: X_LAYER_CHAIN_ID_HEX }],
    });
  } catch (err: unknown) {
    // Error code 4902 means the chain isn't added to the wallet yet — add it.
    const error = err as { code?: number };
    if (error?.code === 4902) {
      await injected.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: X_LAYER_CHAIN_ID_HEX,
            chainName: "X Layer",
            nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
            rpcUrls: ["https://rpc.xlayer.tech"],
            blockExplorerUrls: ["https://www.oklink.com/xlayer"],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

function randomNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// X Layer's CAIP-2 identifier is "eip155:196" — the numeric chain ID for
// EIP-712 domain signing is just 196.
const X_LAYER_CHAIN_ID = 196;

export interface SignedPaymentResult {
  headerValue: string; // base64, ready to send as the X-PAYMENT header
  payer: string;
}

export async function buildAndSignPayment(
  walletKind: "metamask" | "okx",
  requirements: PaymentRequirements,
  resourceUrl: string
): Promise<SignedPaymentResult> {
  const injected = getInjectedProvider(walletKind);
  if (!injected) {
    throw new Error(`${walletKind === "okx" ? "OKX Wallet" : "MetaMask"} not found.`);
  }

  // Switch to X Layer BEFORE signing, so the wallet's confirmation screen
  // shows the correct network and can correctly recognize the USDC token
  // instead of showing "Unknown" from the wrong active chain.
  await ensureXLayerNetwork(injected);

  const provider = new ethers.BrowserProvider(injected as ethers.Eip1193Provider);
  const signer = await provider.getSigner();
  const from = await signer.getAddress();

  const nonce = randomNonce();
  const validAfter = "0";
  const validBefore = Math.floor(Date.now() / 1000 + requirements.maxTimeoutSeconds).toString();

  const domain = {
    name: requirements.extra?.name ?? "USD₮0",
    version: requirements.extra?.version ?? "1",
    chainId: X_LAYER_CHAIN_ID,
    verifyingContract: requirements.asset,
  };

  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  const message = {
    from,
    to: requirements.payTo,
    value: requirements.amount,
    validAfter,
    validBefore,
    nonce,
  };

  // This is the step most likely to surface a wallet popup asking the user
  // to approve a "signature request" — not a transaction, no gas involved.
  const signature = await signer.signTypedData(domain, types, message);

  const paymentPayload = {
    x402Version: 2,
    resource: {
      url: resourceUrl,
      description: "Verixa ASP credential verification",
      mimeType: "application/json",
    },
    accepted: {
      scheme: requirements.scheme,
      network: requirements.network,
      amount: requirements.amount,
      asset: requirements.asset,
      payTo: requirements.payTo,
      maxTimeoutSeconds: requirements.maxTimeoutSeconds,
      extra: requirements.extra,
    },
    payload: {
      signature,
      authorization: message,
    },
  };

  const headerValue = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
  return { headerValue, payer: from };
}
