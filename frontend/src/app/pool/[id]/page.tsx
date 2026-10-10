"use client";
import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Plus, CheckCircle, XCircle, Lock, RotateCcw, Copy, Check } from "lucide-react";
import WalletButton from "@/components/WalletButton";
import { usePool, useJoinPool, useDeposit, useSubmitExpense, useApproveExpense, useSettlePool } from "@/hooks/usePool";
import { useWallet } from "@/hooks/useWallet";
import { formatAmount, parseAmount } from "@/lib/stellar";
import { KNOWN_TOKENS } from "@/types";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function PoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const poolId = BigInt(id);
  const { address, connected } = useWallet();
  const { data: pool, isLoading } = usePool(poolId);

  const joinMut    = useJoinPool(poolId);
  const depositMut = useDeposit(poolId);
  const expenseMut = useSubmitExpense(poolId);
  const approveMut = useApproveExpense(poolId);
  const settleMut  = useSettlePool(poolId);

  const [depositAmt, setDepositAmt]     = useState("");
  const [expenseForm, setExpenseForm]   = useState({ payee: "", amount: "", desc: "" });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading pool…</div>;
  if (!pool) return <div className="min-h-screen flex items-center justify-center text-red-400">Pool #{id} not found.</div>;

  const symbol  = KNOWN_TOKENS.find(t => t.address === pool.token)?.symbol ?? "TOKEN";
  const isOwner = address === pool.owner;
  const isMember = pool.members.some(m => m.address === address);
  const available = pool.totalDeposited - pool.totalSpent;
  const pct = pool.goal > 0n ? Math.min(100, Number(pool.totalDeposited * 100n / pool.goal)) : 0;

  const statusColor: Record<string, string> = {
    Open: "text-emerald-400", Locked: "text-star-400", Settled: "text-gray-400", Cancelled: "text-red-400",
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Pools
        </Link>
        <WalletButton />
      </div>

      {/* Pool header */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{pool.name}</h1>
            <p className={`text-sm font-medium mt-0.5 ${statusColor[pool.status]}`}>{pool.status}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-star-400 font-mono">{formatAmount(available)}</p>
            <p className="text-xs text-gray-500">{symbol} available</p>
          </div>
        </div>

        {pool.goal > 0n && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Goal progress</span>
              <span>{formatAmount(pool.totalDeposited)} / {formatAmount(pool.goal)} {symbol}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-star-500 to-amber-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div><p className="text-xs text-gray-500">Deposited</p><p className="font-mono font-semibold text-white">{formatAmount(pool.totalDeposited)} {symbol}</p></div>
          <div><p className="text-xs text-gray-500">Spent</p><p className="font-mono font-semibold text-white">{formatAmount(pool.totalSpent)} {symbol}</p></div>
          <div><p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Users className="w-3 h-3" />Members</p><p className="font-semibold text-white">{pool.members.length}</p></div>
        </div>
      </div>

      {/* Actions */}
      {pool.status !== "Settled" && pool.status !== "Cancelled" && connected && (
        <div className="card p-5 mb-4 flex flex-col gap-4">
          {/* Join */}
          {!isMember && pool.status === "Open" && (
            <button onClick={() => joinMut.mutate()} disabled={joinMut.isPending}
              className="w-full btn-primary flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> {joinMut.isPending ? "Joining…" : "Join Pool"}
            </button>
          )}

          {/* Deposit */}
          {isMember && pool.status === "Open" && (
            <div>
              <p className="text-sm text-gray-400 mb-2 font-medium">Deposit</p>
              <div className="flex gap-2">
                <input type="number" min="0.01" step="0.01" placeholder="Amount"
                  className="input flex-1" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
                <button onClick={() => depositMut.mutate(depositAmt)} disabled={depositMut.isPending || !depositAmt}
                  className="btn-primary px-5 whitespace-nowrap">
                  {depositMut.isPending ? "…" : `Add ${symbol}`}
                </button>
              </div>
            </div>
          )}

          {/* Submit expense */}
          {isMember && (
            <div>
              <p className="text-sm text-gray-400 mb-2 font-medium">Log an Expense</p>
              <div className="flex flex-col gap-2">
                <input className="input" placeholder="Payee address (G…)" value={expenseForm.payee} onChange={e => setExpenseForm({ ...expenseForm, payee: e.target.value })} />
                <div className="flex gap-2">
                  <input type="number" min="0.01" step="0.01" placeholder="Amount" className="input flex-1"
                    value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                  <input className="input flex-1" placeholder="Description (Hotel, Taxi…)" maxLength={64}
                    value={expenseForm.desc} onChange={e => setExpenseForm({ ...expenseForm, desc: e.target.value })} />
                </div>
                <button
                  onClick={() => expenseMut.mutate({ payee: expenseForm.payee, amount: expenseForm.amount, description: expenseForm.desc })}
                  disabled={expenseMut.isPending || !expenseForm.payee || !expenseForm.amount}
                  className="btn-ghost flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> {expenseMut.isPending ? "Submitting…" : "Submit Expense"}
                </button>
              </div>
            </div>
          )}

          {/* Settle (owner only) */}
          {isOwner && (
            <button onClick={() => { if (confirm("Settle pool and refund remaining balance to all members?")) settleMut.mutate(); }}
              disabled={settleMut.isPending}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium transition-colors disabled:opacity-40">
              <RotateCcw className="w-4 h-4" /> {settleMut.isPending ? "Settling…" : "Settle & Refund"}
            </button>
          )}
        </div>
      )}

      {/* Expenses */}
      {pool.expenses.length > 0 && (
        <div className="card p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Expenses</h2>
          <div className="flex flex-col gap-2">
            {pool.expenses.map((exp, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{exp.description || "—"}</p>
                  <p className="text-xs text-gray-500 font-mono truncate">{exp.payee.slice(0, 12)}…</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <p className="text-sm font-mono font-semibold text-white">{formatAmount(exp.amount)} {symbol}</p>
                  {exp.approved ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="w-3.5 h-3.5" />Paid</span>
                  ) : isOwner ? (
                    <button onClick={() => approveMut.mutate(i)} disabled={approveMut.isPending}
                      className="text-xs px-2.5 py-1 rounded-lg bg-star-500/20 hover:bg-star-500/30 text-star-300 transition-colors">
                      Approve
                    </button>
                  ) : (
                    <span className="text-xs text-yellow-400">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Members</h2>
        <div className="flex flex-col gap-1">
          {pool.members.map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-star-500/20 flex items-center justify-center text-xs text-star-400 shrink-0">
                  {i + 1}
                </div>
                <span className="font-mono text-xs text-gray-300 truncate">
                  {m.address.slice(0, 10)}…{m.address.slice(-4)}
                  {m.address === pool.owner && <span className="ml-1 text-star-400 text-[10px]">owner</span>}
                </span>
                <CopyBtn text={m.address} />
              </div>
              <span className="text-sm font-mono font-semibold text-white shrink-0">{formatAmount(m.deposited)} {symbol}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
