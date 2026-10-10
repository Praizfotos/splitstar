// ============================================================================
// components/MemberList.tsx — Pool members with deposits & refunds
// ============================================================================

"use client";

import { Users, Undo2 } from "lucide-react";
import clsx from "clsx";
import { useWallet } from "@/hooks/useWallet";
import { formatAmount } from "@/lib/stellar";
import type { Member } from "@/types";

interface MemberListProps {
  members: Member[];
  tokenSymbol: string;
  /** Show the refund-due column (pool settled) */
  showRefunds?: boolean;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function MemberList({
  members,
  tokenSymbol,
  showRefunds = false,
}: MemberListProps) {
  const { address } = useWallet();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-[#00d4ff]" />
          Members
        </h2>
        <span className="text-xs text-gray-500 font-mono">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </span>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          No members yet — be the first to deposit!
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-white/5">
          {/* Column headers */}
          <div
            className={clsx(
              "grid items-center gap-3 px-2 pb-2 text-[10px] uppercase tracking-wider text-gray-600",
              showRefunds ? "grid-cols-[auto_1fr_auto_auto]" : "grid-cols-[auto_1fr_auto]"
            )}
          >
            <span>#</span>
            <span>Address</span>
            <span className="text-right">Deposited</span>
            {showRefunds && <span className="text-right">Refund Due</span>}
          </div>

          {members.map((member, i) => {
            const isSelf = address !== null && member.address === address;

            return (
              <div
                key={member.address}
                className={clsx(
                  "grid items-center gap-3 px-2 py-2.5 rounded-lg transition-colors",
                  showRefunds
                    ? "grid-cols-[auto_1fr_auto_auto]"
                    : "grid-cols-[auto_1fr_auto]",
                  isSelf
                    ? "bg-gradient-to-r from-[#7d00ff]/15 to-[#00d4ff]/10 border border-[#7d00ff]/30"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                {/* Rank / avatar */}
                <div
                  className={clsx(
                    "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                    isSelf
                      ? "bg-gradient-to-br from-[#7d00ff] to-[#00d4ff] text-white"
                      : "bg-white/10 text-gray-400"
                  )}
                >
                  {i + 1}
                </div>

                {/* Address */}
                <div className="min-w-0 flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-300 truncate">
                    {shortAddress(member.address)}
                  </span>
                  {isSelf && (
                    <span className="shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-[#7d00ff] to-[#00d4ff] text-white font-bold">
                      You
                    </span>
                  )}
                </div>

                {/* Deposited */}
                <span className="text-right font-mono text-sm text-white tabular-nums">
                  {formatAmount(member.deposited)}{" "}
                  <span className="text-gray-500 text-xs font-normal">
                    {tokenSymbol}
                  </span>
                </span>

                {/* Refund due (settled pools) */}
                {showRefunds && (
                  <span
                    className={clsx(
                      "text-right font-mono text-sm tabular-nums flex items-center justify-end gap-1",
                      member.refundDue > 0n ? "text-emerald-400" : "text-gray-600"
                    )}
                  >
                    {member.refundDue > 0n && (
                      <Undo2 className="w-3 h-3" />
                    )}
                    {formatAmount(member.refundDue)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
