"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
    okxwallet?: EIP1193Provider; // OKX Wallet injects its own provider, separate from window.ethereum
  }
}

export type WalletKind = "metamask" | "okx";

interface WalletState {
  address: string | null;
  shortAddress: string | null;
  walletKind: WalletKind | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

const WALLET_INFO: Record<WalletKind, { label: string; installUrl: string }> = {
  metamask: { label: "MetaMask", installUrl: "https://metamask.io" },
  okx: { label: "OKX Wallet", installUrl: "https://www.okx.com/web3" },
};

function getProvider(kind: WalletKind): EIP1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  return kind === "okx" ? window.okxwallet : window.ethereum;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    shortAddress: null,
    walletKind: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const connect = useCallback(async (kind: WalletKind = "metamask") => {
    const provider = getProvider(kind);

    if (!provider) {
      setState((s) => ({
        ...s,
        error: `${WALLET_INFO[kind].label} not found. Install it at ${WALLET_INFO[kind].installUrl}`,
      }));
      return;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      const ethersProvider = new ethers.BrowserProvider(provider);
      const accounts = await ethersProvider.send("eth_requestAccounts", []);
      const address = (accounts as string[])[0];

      setState({
        address,
        shortAddress: shorten(address),
        walletKind: kind,
        isConnecting: false,
        isConnected: true,
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection rejected.";
      setState((s) => ({ ...s, isConnecting: false, error: message }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      shortAddress: null,
      walletKind: null,
      isConnecting: false,
      isConnected: false,
      error: null,
    });
  }, []);

  // Re-hydrate an existing session on mount. Checks OKX first, falls back to
  // MetaMask — if both happen to already be connected, OKX wins since that's
  // the ecosystem this build is targeting.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tryRehydrate = async (kind: WalletKind) => {
      const provider = getProvider(kind);
      if (!provider) return false;
      try {
        const ethersProvider = new ethers.BrowserProvider(provider);
        const accounts = (await ethersProvider.send("eth_accounts", [])) as string[];
        if (accounts.length > 0) {
          setState({
            address: accounts[0],
            shortAddress: shorten(accounts[0]),
            walletKind: kind,
            isConnecting: false,
            isConnected: true,
            error: null,
          });
          return true;
        }
        return false;
      } catch {
        // Some wallets (e.g. OKX Wallet) throw on eth_accounts for an
        // unauthorized/not-yet-connected origin instead of returning [].
        // Treat that the same as "not connected" — the user just hasn't
        // clicked connect yet, this isn't a real error.
        return false;
      }
    };

    (async () => {
      const gotOkx = await tryRehydrate("okx");
      if (!gotOkx) await tryRehydrate("metamask");
    })();
  }, []);

  // Listen for account changes on whichever provider is currently active
  useEffect(() => {
    if (!state.walletKind) return;
    const provider = getProvider(state.walletKind);
    if (!provider) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState((s) => ({
          ...s,
          address: accounts[0],
          shortAddress: shorten(accounts[0]),
          isConnecting: false,
          isConnected: true,
          error: null,
        }));
      }
    };

    provider.on("accountsChanged", handleAccountsChanged);
    return () => provider.removeListener("accountsChanged", handleAccountsChanged);
  }, [state.walletKind, disconnect]);

  return { ...state, connect, disconnect };
}