// ============================================================================
// components/CreatePoolForm.tsx — Form to create a new expense pool
// ============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, Target, CheckCircle2, ArrowRight } from "lucide-react";
import { useCreatePool } from "@/hooks/usePool";
import { useWallet } from "@/hooks/useWallet";
import { KNOWN_TOKENS } from "@/types";

/** Shape accepted by the useCreatePool mutation */
export interface CreatePoolFormValues {
  name: string;
  tokenAddress: string;
  goalAmount: string; // human-readable; "" = no goal
  maxMembers: number;
}

export default function CreatePoolForm() {
  const { connected } = useWallet();
  const createMut = useCreatePool();

  const [name, setName] = useState("");
  const [tokenAddress, setTokenAddress] = useState(KNOWN_TOKENS[0].address);
  const [goalAmount, setGoalAmount] = useState("");
  const [maxMembers, setMaxMembers] = useState(5);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const symbol =
    KNOWN_TOKENS.find((t) => t.address === tokenAddress)?.symbol ?? "TOKEN";

  const createdId: string | null =
    createMut.data != null ? String(createMut.data) : null;

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Give your pool a name";
    else if (name.trim().length > 60) next.name = "Name must be 60 characters or less";
    if (goalAmount && (isNaN(parseFloat(goalAmount)) || parseFloat(goalAmount) <= 0))
      next.goalAmount = "Goal must be a positive number (or leave empty)";
    if (maxMembers < 1 || maxMembers > 20)
      next.maxMembers = "Max members must be between 1 and 20";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    createMut.mutate({
      name: name.trim(),
      token: tokenAddress,
      goal: goalAmount.trim(),
      maxMembers,
    });
  }

  function resetForm() {
    createMut.reset();
    setName("");
    setGoalAmount("");
    setTokenAddress(KNOWN_TOKENS[0].address);
    setMaxMembers(5);
    setErrors({});
  }

  // ── Success state ───────────────────────────────────────────────────────────
  if (createdId !== null) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7d00ff] to-[#00d4ff] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#7d00ff]/30">
          <CheckCircle2 className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Pool Created! ✦</h2>
        <p className="text-sm text-gray-400 mb-4">
          Your pool is live on Stellar. Share the ID with your group so members
          can join and deposit.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 border border-white/10 mb-6">
          <span className="text-xs text-gray-500">Pool ID</span>
          <span className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#c4a1ff] to-[#7de0ff]">
            #{createdId}
          </span>
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href={`/pool/${createdId}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7d00ff] to-[#00d4ff] text-white font-semibold text-sm shadow-lg shadow-[#7d00ff]/25 hover:from-[#8f1aff] hover:to-[#22dcff] transition-all"
          >
            Go to Pool
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={resetForm}
            className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-[#7d00ff]/40 text-sm font-medium transition-colors"
          >
            Create another
          </button>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
      <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
        <Plus className="w-5 h-5 text-[#a855f7]" />
        New Pool
      </h2>

      {!connected && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
          Connect your wallet to create a pool.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Pool name */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Pool Name</label>
          <input
            type="text"
            placeholder="e.g. Lisbon Trip 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#7d00ff]/60 focus:ring-1 focus:ring-[#7d00ff]/40 text-sm transition-colors"
          />
          {errors.name && (
            <p className="text-xs text-red-400 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Token */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Token</label>
          <select
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#7d00ff]/60 text-sm transition-colors"
          >
            {KNOWN_TOKENS.map((t) => (
              <option key={t.address} value={t.address}>
                {t.symbol} — {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Goal (optional) */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#00d4ff]" />
            Goal Amount <span className="text-gray-600 text-xs">(optional)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.0000001"
              min="0"
              placeholder="Leave empty for no goal"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-16 text-white placeholder-gray-600 focus:outline-none focus:border-[#7d00ff]/60 focus:ring-1 focus:ring-[#7d00ff]/40 text-sm transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              {symbol}
            </span>
          </div>
          {errors.goalAmount && (
            <p className="text-xs text-red-400 mt-1">{errors.goalAmount}</p>
          )}
        </div>

        {/* Max members */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#a855f7]" />
              Max Members
            </span>
            <span className="font-mono font-bold text-white">{maxMembers}</span>
          </label>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={maxMembers}
            onChange={(e) => setMaxMembers(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-[#7d00ff] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1 font-mono">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!connected || createMut.isPending}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7d00ff] to-[#00d4ff] hover:from-[#8f1aff] hover:to-[#22dcff] text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#7d00ff]/25 mt-2 hover:scale-[1.01] active:scale-[0.99]"
        >
          {createMut.isPending ? "Creating Pool…" : "Create Pool ✦"}
        </button>

        <p className="text-xs text-center text-gray-600">
          Deployed on Stellar — settlement in ~5 seconds, fees under a cent.
        </p>
      </form>
    </div>
  );
}
