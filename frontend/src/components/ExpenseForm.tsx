// ============================================================================
// components/ExpenseForm.tsx — Submit a pool expense for approval
// ============================================================================

"use client";

import { useState } from "react";
import { Receipt, FileText, DollarSign, User } from "lucide-react";
import { useSubmitExpense } from "@/hooks/usePool";
import { useWallet } from "@/hooks/useWallet";

interface ExpenseFormProps {
  poolId: bigint;
  tokenSymbol: string;
}

export default function ExpenseForm({ poolId, tokenSymbol }: ExpenseFormProps) {
  const { connected } = useWallet();
  const submitMut = useSubmitExpense(poolId);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payee, setPayee] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!description.trim()) next.description = "Describe the expense";
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
      next.amount = "Enter an amount > 0";
    if (!payee || payee.length < 56)
      next.payee = "Enter a valid Stellar address (G…)";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    submitMut.mutate({
      description: description.trim(),
      amount: amount.trim(),
      payee: payee.trim(),
    });
    // Clear optimistically — toasts come from the mutation hook
    setDescription("");
    setAmount("");
    setPayee("");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Receipt className="w-4 h-4 text-[#a855f7]" />
        Submit Expense
      </h2>

      {!connected && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
          Connect your wallet to submit an expense.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Description */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Description
          </label>
          <input
            type="text"
            placeholder="e.g. Dinner at Prado"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={120}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#7d00ff]/60 focus:ring-1 focus:ring-[#7d00ff]/40 text-sm transition-colors"
          />
          {errors.description && (
            <p className="text-xs text-red-400 mt-1">{errors.description}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.0000001"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-20 text-white placeholder-gray-600 focus:outline-none focus:border-[#7d00ff]/60 focus:ring-1 focus:ring-[#7d00ff]/40 text-sm font-mono transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              {tokenSymbol}
            </span>
          </div>
          {errors.amount && (
            <p className="text-xs text-red-400 mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Payee */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Payee Address
          </label>
          <input
            type="text"
            placeholder="G…"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#7d00ff]/60 focus:ring-1 focus:ring-[#7d00ff]/40 text-sm font-mono transition-colors"
          />
          {errors.payee && (
            <p className="text-xs text-red-400 mt-1">{errors.payee}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!connected || submitMut.isPending}
          className="w-full py-2.5 rounded-xl border border-[#7d00ff]/40 bg-[#7d00ff]/10 hover:bg-[#7d00ff]/20 text-[#e9d5ff] font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-1"
        >
          {submitMut.isPending ? "Submitting…" : "Submit Expense"}
        </button>

        <p className="text-[11px] text-gray-600 text-center">
          The pool owner must approve this expense before it&apos;s paid out.
        </p>
      </form>
    </div>
  );
}
