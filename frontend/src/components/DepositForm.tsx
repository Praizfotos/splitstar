// ============================================================================
// components/DepositForm.tsx — Deposit tokens into an open pool
// ============================================================================

"use client";

import { useState } from "react";
import { ArrowDownToLine, Wallet } from "lucide-react";
import { useDeposit } from "@/hooks/usePool";
import { useWallet } from "@/hooks/useWallet";
import { formatAmount } from "@/lib/stellar";

interface DepositFormProps {
  poolId: bigint;
  tokenSymbol: string;
  /** The connected member's deposited total, if any */
  memberDeposited?: bigint | null;
}

const QUICK_ADDS = [10, 50, 100];

export default function DepositForm({
  poolId,
  tokenSymbol,
  memberDeposited = null,
}: DepositFormProps) {
  const { connected } = useWallet();
  const depositMut = useDeposit(poolId);
  const [amount, setAmount] = useState("");

  const parsed = parseFloat(amount);
  const invalid = amount !== "" && (isNaN(parsed) || parsed <= 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || invalid) return;
    depositMut.mutate(amount.trim());
    setAmount("");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <ArrowDownToLine className="w-4 h-4 text-[#00d4ff]" />
        Deposit Funds
      </h2>

      {!connected && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
          Connect your wallet to deposit.
        </div>
      )}

      {/* Available balance */}
      {memberDeposited !== null && (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-black/25 border border-white/5 mb-4">
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            Your deposit so far
          </span>
          <span className="font-mono text-sm font-bold text-white tabular-nums">
            {formatAmount(memberDeposited)}{" "}
            <span className="text-gray-500 font-normal text-xs">{tokenSymbol}</span>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Amount */}
        <div className="relative">
          <input
            type="number"
            step="0.0000001"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-20 text-white text-lg font-mono placeholder-gray-600 focus:outline-none focus:border-[#7d00ff]/60 focus:ring-1 focus:ring-[#7d00ff]/40 transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
            {tokenSymbol}
          </span>
        </div>

        {invalid && <p className="text-xs text-red-400">Enter an amount &gt; 0</p>}

        {/* Quick add buttons */}
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ADDS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              className="py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-gray-300 hover:text-white hover:border-[#00d4ff]/40 hover:bg-[#00d4ff]/10 transition-all"
            >
              {q} {tokenSymbol}
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!connected || depositMut.isPending || !amount || invalid}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7d00ff] to-[#00d4ff] hover:from-[#8f1aff] hover:to-[#22dcff] text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#7d00ff]/25 hover:scale-[1.01] active:scale-[0.99]"
        >
          {depositMut.isPending ? "Depositing…" : "Deposit"}
        </button>
      </form>
    </div>
  );
}
