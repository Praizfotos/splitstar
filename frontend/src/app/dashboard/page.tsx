"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Star, Search } from "lucide-react";
import WalletButton from "@/components/WalletButton";
import PoolCard from "@/components/PoolCard";
import { usePoolCount, usePool } from "@/hooks/usePool";
import { useWallet } from "@/hooks/useWallet";
import { readContract } from "@/lib/stellar";
import { nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import { useQuery } from "@tanstack/react-query";
import type { Pool } from "@/types";

function mapPool(raw: any, id: bigint): Pool {
  return {
    id,
    name:           Buffer.from(raw.name).toString("utf8").replace(/\0/g, ""),
    owner:          raw.owner,
    token:          raw.token,
    goal:           BigInt(raw.goal),
    totalDeposited: BigInt(raw.total_deposited),
    totalSpent:     BigInt(raw.total_spent),
    members:        (raw.members ?? []).map((m: any) => ({ address: m.address, deposited: BigInt(m.deposited), refundDue: BigInt(m.refund_due) })),
    expenses:       (raw.expenses ?? []).map((e: any) => ({ description: Buffer.from(e.description).toString("utf8").replace(/\0/g, ""), amount: BigInt(e.amount), payee: e.payee, submittedBy: e.submitted_by, approved: e.approved })),
    status:         raw.status as Pool["status"],
    createdAt:      raw.created_at,
    maxMembers:     raw.max_members,
  };
}

function useAllPools() {
  const { data: count = 0 } = usePoolCount();
  return useQuery({
    queryKey: ["all-pools", count],
    queryFn: async () => {
      const ids = Array.from({ length: Math.min(count, 30) }, (_, i) => BigInt(i));
      const results = await Promise.allSettled(ids.map(async id => {
        const raw = await readContract("get_pool", [nativeToScVal(id, { type: "u64" })]);
        return raw ? mapPool(raw, id) : null;
      }));
      return results.filter((r): r is PromiseFulfilledResult<Pool | null> => r.status === "fulfilled")
        .map(r => r.value).filter((p): p is Pool => p !== null);
    },
    enabled: count > 0,
    refetchInterval: 20_000,
  });
}

export default function DashboardPage() {
  const { address } = useWallet();
  const { data: pools = [], isLoading } = useAllPools();
  const [filter, setFilter] = useState<"all" | "mine" | "open">("all");
  const [search, setSearch] = useState("");

  const filtered = pools.filter(p => {
    if (filter === "mine") return address && (p.owner === address || p.members.some(m => m.address === address));
    if (filter === "open") return p.status === "Open";
    return true;
  }).filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search));

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-star-500 flex items-center justify-center">
            <Star className="w-5 h-5 text-black fill-black" />
          </div>
          <span className="font-bold text-white">SplitStar</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/create" className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> New Pool
          </Link>
          <WalletButton />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 gap-1">
          {(["all", "mine", "open"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? "bg-star-500 text-black" : "text-gray-400 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input pl-9" placeholder="Search pools…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-gray-500 gap-3">
          <div className="w-5 h-5 border-2 border-star-500 border-t-transparent rounded-full animate-spin" />
          Loading pools…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p className="text-lg mb-2">No pools yet</p>
          <Link href="/create" className="text-star-400 hover:underline text-sm">Create the first one →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(pool => <PoolCard key={pool.id.toString()} pool={pool} />)}
        </div>
      )}
    </div>
  );
}
