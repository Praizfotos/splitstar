"use client";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

export default function WalletButton() {
  const { address, connected, connecting, error, connect, disconnect } = useWallet();
  if (connecting) return (
    <button disabled className="flex items-center gap-2 px-4 py-2 rounded-xl bg-star-500/20 text-star-300 cursor-not-allowed">
      <Loader2 className="w-4 h-4 animate-spin" /> Connecting…
    </button>
  );
  if (connected && address) return (
    <div className="flex items-center gap-2">
      <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-gray-200 text-sm font-mono">
        {address.slice(0, 4)}…{address.slice(-4)}
      </span>
      <button onClick={disconnect} className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Disconnect">
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={connect} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-star-500 hover:bg-star-600 text-black font-semibold transition-colors">
        <Wallet className="w-4 h-4" /> Connect Wallet
      </button>
      {error && <p className="text-xs text-red-400 max-w-xs text-right">{error}</p>}
    </div>
  );
}
