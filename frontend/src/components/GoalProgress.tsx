// ============================================================================
// components/GoalProgress.tsx — Animated gradient goal progress bar
// ============================================================================

import { Target } from "lucide-react";
import { formatAmount } from "@/lib/stellar";

interface GoalProgressProps {
  goal: bigint;
  current: bigint;
  tokenSymbol?: string;
  /** Compact mode hides the big numbers (used inside PoolCard) */
  compact?: boolean;
}

export default function GoalProgress({
  goal,
  current,
  tokenSymbol = "XLM",
  compact = false,
}: GoalProgressProps) {
  const hasGoal = goal > 0n;
  const pct = hasGoal
    ? Math.min(100, Number((current * 100n) / goal))
    : 0;

  if (!hasGoal) {
    if (compact) return null;
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-500" />
          Goal
        </h2>
        <p className="text-sm text-gray-500">
          This pool has no funding goal — members can deposit freely.
        </p>
      </div>
    );
  }

  return (
    <div>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-[#00d4ff]" />
            Goal Progress
          </h2>
          <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#7d00ff] to-[#00d4ff]">
            {pct}%
          </span>
        </div>
      )}

      {/* Amounts */}
      <div className={`flex items-baseline justify-between ${compact ? "mb-1.5" : "mb-2"}`}>
        <span
          className={`font-mono font-bold text-white tabular-nums ${
            compact ? "text-sm" : "text-xl"
          }`}
        >
          {formatAmount(current)}
          <span className="text-gray-500 font-normal text-xs ml-1">
            {tokenSymbol}
          </span>
        </span>
        <span className={`text-gray-500 ${compact ? "text-[11px]" : "text-sm"}`}>
          of {formatAmount(goal)} {tokenSymbol}
        </span>
      </div>

      {/* Bar */}
      <div
        className={`relative rounded-full bg-white/10 overflow-hidden ${
          compact ? "h-1.5" : "h-3"
        }`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7d00ff] via-[#a855f7] to-[#00d4ff] shadow-[0_0_16px_rgba(125,0,255,0.6)] transition-all duration-700 ease-out relative"
          style={{ width: `${pct}%` }}
        >
          {!compact && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-pulse" />
          )}
        </div>
      </div>

      {pct >= 100 && !compact && (
        <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
          ✦ Goal reached — ready to lock and settle!
        </p>
      )}
    </div>
  );
}
