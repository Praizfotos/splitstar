// ============================================================================
// app/create/page.tsx — Dedicated pool creation page
// ============================================================================

import Navbar from "@/components/Navbar";
import CreatePoolForm from "@/components/CreatePoolForm";
import { Users, Target, Lock, Scale } from "lucide-react";

const INSTRUCTIONS = [
  {
    icon: Users,
    title: "Name & invite",
    body: "Give the pool a name your group will recognise. Max members can be set from 1 to 20.",
  },
  {
    icon: Target,
    title: "Optional goal",
    body: "Set a funding goal to track progress. Leave it empty for an open-ended pool.",
  },
  {
    icon: Lock,
    title: "Deposit while Open",
    body: "Members deposit XLM or USDC while the pool is Open. Anyone can top up at any time.",
  },
  {
    icon: Scale,
    title: "Lock, approve, settle",
    body: "The owner locks the pool, approves expenses, then settles — refunds go out automatically.",
  },
];

export default function CreatePage() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(125,0,255,0.12),transparent_55%)]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Create a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c4a1ff] to-[#7de0ff]">
              Pool
            </span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            A pool is a shared vault for your group. Everyone deposits, expenses
            get approved on-chain, and settlement is instant.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Form — 3/5 */}
          <div className="lg:col-span-3">
            <CreatePoolForm />
          </div>

          {/* Instructions — 2/5 */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {INSTRUCTIONS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 flex gap-3 hover:border-[#7d00ff]/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7d00ff]/25 to-[#00d4ff]/25 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-[#c4a1ff]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">
                    {title}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-[#00d4ff]/20 bg-[#00d4ff]/5 p-4 text-sm">
              <p className="text-[#7de0ff] font-medium mb-1">Heads up</p>
              <p className="text-gray-500 text-xs leading-relaxed">
                Only the pool owner can lock and settle. Expenses always need the
                owner&apos;s approval — so pick someone you trust to hold the keys.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
