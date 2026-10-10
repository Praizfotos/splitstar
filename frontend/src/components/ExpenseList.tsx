// ============================================================================
// components/ExpenseList.tsx — Pool expenses with approval workflow
// ============================================================================

"use client";

import { Receipt, Check, Clock, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { useApproveExpense } from "@/hooks/usePool";
import { useWallet } from "@/hooks/useWallet";
import { formatAmount, HORIZON_URL } from "@/lib/stellar";
import type { Expense } from "@/types";

interface ExpenseListProps {
  expenses: Expense[];
  poolId: bigint;
  tokenSymbol: string;
  /** True when the connected wallet is the pool owner */
  isOwner: boolean;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function ExpenseList({
  expenses,
  poolId,
  tokenSymbol,
  isOwner,
}: ExpenseListProps) {
  const { address } = useWallet();
  const approveMut = useApproveExpense(poolId);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#a855f7]" />
          Expenses
        </h2>
        <span className="text-xs text-gray-500 font-mono">
          {expenses.length} total
        </span>
      </div>

      {expenses.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No expenses submitted yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {expenses.map((expense, index) => {
            const isSubmitter = address !== null && expense.submittedBy === address;

            return (
              <div
                key={`${expense.description}-${index}`}
                className={clsx(
                  "rounded-xl border p-4 transition-colors",
                  expense.approved
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-white/10 bg-black/20 hover:border-white/20"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: description + meta */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-white text-sm truncate">
                        {expense.description}
                      </p>
                      {isSubmitter && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#7d00ff]/20 text-[#d8b4fe] font-bold shrink-0">
                          Yours
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        Payee
                        <a
                          href={`${HORIZON_URL}/accounts/${expense.payee}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-gray-400 hover:text-[#7de0ff] transition-colors inline-flex items-center gap-0.5"
                        >
                          {shortAddress(expense.payee)}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </span>
                      <span className="text-gray-700">·</span>
                      <span className="flex items-center gap-1">
                        By
                        <span className="font-mono text-gray-400">
                          {shortAddress(expense.submittedBy)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Right: amount + status / approve */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-mono font-bold text-white tabular-nums">
                      {formatAmount(expense.amount)}{" "}
                      <span className="text-gray-500 font-normal text-xs">
                        {tokenSymbol}
                      </span>
                    </span>

                    {expense.approved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium">
                        <Check className="w-3 h-3" />
                        Approved
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-medium">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => approveMut.mutate(index)}
                            disabled={approveMut.isPending}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#7d00ff] to-[#00d4ff] text-white font-semibold hover:from-[#8f1aff] hover:to-[#22dcff] transition-all disabled:opacity-40 shadow-sm"
                          >
                            <Check className="w-3 h-3" />
                            {approveMut.isPending ? "Approving…" : "Approve"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isOwner && expenses.some((e) => !e.approved) && (
        <p className="text-[11px] text-gray-600 mt-3 text-center">
          As pool owner you can approve pending expenses to release funds.
        </p>
      )}
    </div>
  );
}
