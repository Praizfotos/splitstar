"use client";
import { create } from "zustand";
import { connectWallet } from "@/lib/wallet";
import { NETWORK_PASSPHRASE } from "@/lib/stellar";

interface WalletStore {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useWallet = create<WalletStore>((set) => ({
  address: null, connected: false, connecting: false, error: null,
  connect: async () => {
    set({ connecting: true, error: null });
    try {
      const info = await connectWallet();
      if (info.networkPassphrase !== NETWORK_PASSPHRASE) {
        throw new Error(`Switch Freighter to ${process.env.NEXT_PUBLIC_NETWORK ?? "testnet"}`);
      }
      set({ address: info.address, connected: true, connecting: false });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Wallet error", connecting: false });
    }
  },
  disconnect: () => set({ address: null, connected: false, error: null }),
}));
