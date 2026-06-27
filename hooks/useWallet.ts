"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

interface WalletState {
  address: string | null;
  shortAddress: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    shortAddress: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  const shorten = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setState((s) => ({
        ...s,
        error: "MetaMask not found. Please install it at metamask.io",
      }));
      return;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = (accounts as string[])[0];

      setState({
        address,
        shortAddress: shorten(address),
        isConnecting: false,
        isConnected: true,
        error: null,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Connection rejected.";
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: message,
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      shortAddress: null,
      isConnecting: false,
      isConnected: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    provider.send("eth_accounts", []).then((accounts) => {
      const list = accounts as string[];
      if (list.length > 0) {
        setState({
          address: list[0],
          shortAddress: shorten(list[0]),
          isConnecting: false,
          isConnected: true,
          error: null,
        });
      }
    });

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState({
          address: accounts[0],
          shortAddress: shorten(accounts[0]),
          isConnecting: false,
          isConnected: true,
          error: null,
        });
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [disconnect]);

  return { ...state, connect, disconnect };
}