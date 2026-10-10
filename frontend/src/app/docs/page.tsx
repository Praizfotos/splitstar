// ============================================================================
// app/docs/page.tsx — SplitStar documentation
// ============================================================================

import Navbar from "@/components/Navbar";
import {
  BookOpen,
  ListOrdered,
  FileCode2,
  ExternalLink,
  Shield,
  Terminal,
} from "lucide-react";
import { CONTRACT_ID, NETWORK } from "@/lib/stellar";

function Section({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
        <Icon className="w-5 h-5 text-[#a855f7]" />
        {title}
      </h2>
      {children}
    </section>
  );
}

const STEPS = [
  {
    n: "1",
    title: "Create a pool",
    body: "The owner calls create_pool with a name, token (XLM or USDC), an optional funding goal, and a max member count. The pool starts in Open status.",
  },
  {
    n: "2",
    title: "Members deposit",
    body: "While the pool is Open, anyone can call deposit to contribute tokens. Deposits are escrowed by the contract — nobody can withdraw early.",
  },
  {
    n: "3",
    title: "Expenses are submitted & approved",
    body: "Any member can submit_expense (description, amount, payee). The pool owner must call approve_expense to mark it paid — approved expenses count toward the pool's spent total.",
  },
  {
    n: "4",
    title: "Lock & settle",
    body: "The owner locks the pool to stop new deposits, then settles. Remaining funds are refunded to members in proportion to their deposits — instantly, on-chain.",
  },
];

const API_ROWS = [
  { method: "initialize",     actor: "Admin",  description: "One-time contract setup" },
  { method: "create_pool",    actor: "Anyone", description: "Create a pool (name, token, goal, max members)" },
  { method: "join_pool",      actor: "Member", description: "Join a pool before depositing" },
  { method: "deposit",        actor: "Member", description: "Deposit tokens into an Open pool" },
  { method: "lock_pool",      actor: "Owner",  description: "Freeze an Open pool (no more deposits/expenses)" },
  { method: "submit_expense", actor: "Member", description: "Record an expense awaiting approval" },
  { method: "approve_expense",actor: "Owner",  description: "Approve a pending expense and release funds" },
  { method: "settle_pool",    actor: "Owner",  description: "Refund remaining balance to all members" },
  { method: "cancel_pool",    actor: "Owner",  description: "Cancel an Open/Locked pool; refund everyone" },
  { method: "get_pool",       actor: "Anyone", description: "Read full Pool data for a given ID" },
  { method: "available_balance", actor: "Anyone", description: "Unspent tokens still held by the pool" },
  { method: "member_balance",    actor: "Anyone", description: "A member's current refundable balance" },
  { method: "goal_progress_pct", actor: "Anyone", description: "Goal completion percentage (0–100)" },
  { method: "next_pool_id",      actor: "Anyone", description: "Current pool ID counter" },
];

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10 min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(125,0,255,0.1),transparent_55%)]">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-7 h-7 text-[#a855f7]" />
            <h1 className="text-3xl font-extrabold text-white">SplitStar Docs</h1>
          </div>
          <p className="text-gray-400">
            Technical reference for the SplitStar shared-expense pool contract
            running on Stellar Soroban.
          </p>
        </div>

        {/* How it works */}
        <Section title="How it works" icon={ListOrdered}>
          <div className="flex flex-col gap-3">
            {STEPS.map(({ n, title, body }) => (
              <div
                key={n}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 flex gap-4 hover:border-[#7d00ff]/30 transition-colors"
              >
                <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#7d00ff] to-[#00d4ff] text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-[#7d00ff]/25">
                  {n}
                </div>
                <div>
                  <p className="font-semibold text-white mb-0.5">{title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Contract address */}
        <Section title="Contract" icon={FileCode2}>
          <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-gray-500">
                Contract ID · {NETWORK}
              </span>
              <span
                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-medium ${
                  CONTRACT_ID
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                }`}
              >
                {CONTRACT_ID ? "Deployed" : "Not deployed"}
              </span>
            </div>
            <p className="font-mono text-sm text-[#7de0ff] break-all leading-relaxed">
              {CONTRACT_ID || "Set NEXT_PUBLIC_CONTRACT_ID after running the deploy script."}
            </p>
          </div>

          <pre className="mt-4 rounded-xl bg-black/60 border border-white/10 p-4 overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed">
            <code>{`# Build the contract
cargo build --manifest-path contracts/splitstar/Cargo.toml --release

# Deploy to testnet + save the contract ID
chmod +x scripts/deploy.sh && ./scripts/deploy.sh`}</code>
          </pre>
        </Section>

        {/* Contract API */}
        <Section title="Contract API" icon={Terminal}>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase">
                    Method
                  </th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase">
                    Who
                  </th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {API_ROWS.map((row) => (
                  <tr key={row.method} className="border-b border-white/5">
                    <td className="px-4 py-2.5">
                      <code className="text-[#c4a1ff] text-sm">{row.method}</code>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-400">
                      {row.actor}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">
                      {row.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Security */}
        <Section title="Security design" icon={Shield}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: "Escrowed deposits",
                body: "Tokens live in the contract. Only settle or cancel can move them, and only back to members.",
              },
              {
                title: "Owner-gated approvals",
                body: "Every approve_expense call checks require_auth on the pool owner — members can't self-approve.",
              },
              {
                title: "Proportional refunds",
                body: "Settlement math is exact integer (i128) arithmetic — every stroop is accounted for.",
              },
              {
                title: "State machine",
                body: "Open → Locked → Settled (or Cancelled). Each transition is guarded; illegal moves revert.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-sm font-semibold text-gray-200 mb-0.5">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Links */}
        <div className="flex flex-wrap gap-3 text-sm">
          {[
            { label: "Stellar Docs",     href: "https://developers.stellar.org" },
            { label: "Soroban SDK",      href: "https://github.com/stellar/rs-soroban-sdk" },
            { label: "Soroban Examples", href: "https://github.com/stellar/soroban-examples" },
            { label: "Freighter Wallet", href: "https://freighter.app" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-[#7de0ff] hover:border-[#00d4ff]/30 transition-colors"
            >
              {label}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </main>
    </>
  );
}
