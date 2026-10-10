// ============================================================================
// app/page.tsx — SplitStar landing page
// ============================================================================

import Link from "next/link";
import {
  ArrowRight,
  Users,
  Receipt,
  Zap,
  Globe,
  Star,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const FEATURES = [
  {
    icon: Users,
    title: "Create Pools",
    body: "Spin up a shared pool in seconds. Pick a token, set a goal, and invite your group with a single ID.",
  },
  {
    icon: Receipt,
    title: "Split Expenses",
    body: "Anyone in the pool submits expenses. The owner approves each one — every cent is tracked on-chain.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    body: "Lock the pool and everyone gets their exact share back in ~5 seconds. No IOUs, no chasing people.",
  },
  {
    icon: Globe,
    title: "180 Countries",
    body: "Stellar reaches wherever your group does. Send and settle value across borders for fractions of a cent.",
  },
];

const STEPS = [
  { step: "01", title: "Create a pool", body: "Name it, pick XLM or USDC, set a max member count." },
  { step: "02", title: "Everyone deposits", body: "Members fund the pool — the contract holds the tokens." },
  { step: "03", title: "Submit & approve expenses", body: "Track shared spend; the owner signs off on each one." },
  { step: "04", title: "Lock & settle", body: "Refunds are distributed automatically, member by member." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(125,0,255,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(0,212,255,0.1),transparent_50%)]">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-medium mb-6 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#7d00ff] to-[#00d4ff] animate-pulse" />
          Live on Stellar Testnet · Powered by Soroban
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#c4a1ff] via-white to-[#7de0ff] mb-6 leading-[1.05]">
          Split Group Expenses.
          <br />
          Settle Instantly.
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
          SplitStar is a shared-expense pool on Stellar. Pool your funds, track
          every expense on-chain, and settle up in a single click — with fees
          under a cent and settlement in five seconds.
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-10 mt-2 mb-10 text-center">
          {[
            { label: "Settlement", value: "~5 sec" },
            { label: "Tx Fee", value: "< $0.001" },
            { label: "Reach", value: "180+" },
            { label: "Custody", value: "0" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-white font-mono tabular-nums">
                {value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/create"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#7d00ff] to-[#00d4ff] text-white font-bold shadow-xl shadow-[#7d00ff]/30 hover:from-[#8f1aff] hover:to-[#22dcff] hover:shadow-[#7d00ff]/50 hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            <Star className="w-4 h-4 fill-white" />
            Create Your First Pool
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-gray-300 hover:text-white hover:border-[#00d4ff]/40 transition-colors font-medium"
          >
            Read the Docs
          </Link>
        </div>
      </section>

      {/* ── Feature cards ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:border-[#7d00ff]/40 hover:bg-white/[0.07] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7d00ff]/10 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7d00ff]/25 to-[#00d4ff]/25 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-[#c4a1ff]" />
              </div>
              <p className="font-semibold text-white mb-1.5">{title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-white mb-2">
            Four steps to settle up
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            No spreadsheets, no trust required — the contract does the math.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ step, title, body }) => (
              <div key={step} className="relative">
                <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7d00ff]/60 to-[#00d4ff]/60 font-mono">
                  {step}
                </span>
                <p className="font-semibold text-white mt-2 mb-1">{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20 text-center">
        <div className="rounded-3xl border border-[#7d00ff]/20 bg-gradient-to-r from-[#7d00ff]/10 via-transparent to-[#00d4ff]/10 backdrop-blur-md p-10">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Ready to split?{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c4a1ff] to-[#7de0ff]">
              Look to the stars.
            </span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-6">
            Connect Freighter, create a pool, and settle your next group
            expense without a single reminder message.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#7d00ff] to-[#00d4ff] text-white font-bold shadow-xl shadow-[#7d00ff]/30 hover:from-[#8f1aff] hover:to-[#22dcff] hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            Create Your First Pool
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#7d00ff] fill-[#7d00ff]" />
            <p>© 2026 SplitStar. Open-source under MIT License.</p>
          </div>
          <div className="flex gap-5">
            <a
              href="https://github.com/splitstar/splitstar"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors inline-flex items-center gap-1"
            >
              GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
            <Link href="/docs" className="hover:text-gray-300 transition-colors">
              Docs
            </Link>
            <a
              href="https://developers.stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors inline-flex items-center gap-1"
            >
              Stellar Docs
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
