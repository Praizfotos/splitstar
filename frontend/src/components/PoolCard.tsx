"use client";
import Link from "next/link";
import { Users, Target, Banknote } from "lucide-react";
import { formatAmount } from "@/lib/stellar";
import { KNOWN_TOKENS } from "@/types";
import type { Pool } from "@/types";

const statusColor: Record<string, string> = {
  Open:      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Locked:    "bg-star-500/20    text-star-400    border-star-500/30",
  Settled:   "bg-gray-500/20    text-gray-400    border-gray-500/30",
  Cancelled: "bg-red-500/20     text-red-400     border-red-500/30",
};

export default function PoolCard({ pool }: { pool: Pool }) {
  const symbol = KNOWN_TOKENS.find(t => t.address === pool.token)?.symbol ?? "TOKEN";
  const pct = pool.goal > 0n
    ? Math.min(100, Number((pool.totalDeposited * 100n) / pool.goal))
    : 0;

  return (
    <Link href={`/pool/${pool.id}`}>
      <div className="card p-5 hover:border-star-500/40 transition-colors cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-white group-hover:text-star-300 transition-colors truncate pr-2">
            {pool.name}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${statusColor[pool.status]}`}>
            {pool.status}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div>
            <p className="text-xs text-gray-500">Raised</p>
            <p className="text-sm font-semibold text-white font-mono">{formatAmount(pool.totalDeposited)} {symbol}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Users className="w-3 h-3" />Members</p>
            <p className="text-sm font-semibold text-white">{pool.members.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Banknote className="w-3 h-3" />Spent</p>
            <p className="text-sm font-semibold text-white font-mono">{formatAmount(pool.totalSpent)}</p>
          </div>
        </div>

        {pool.goal > 0n && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1"><Target className="w-3 h-3" />Goal</span>
              <span>{pct}% of {formatAmount(pool.goal)} {symbol}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-star-500 to-amber-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
