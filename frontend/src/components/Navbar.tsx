// ============================================================================
// components/Navbar.tsx — Shared navigation bar (glass morphism)
// ============================================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star, LayoutDashboard, Plus, BookOpen } from "lucide-react";
import clsx from "clsx";
import WalletButton from "./WalletButton";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create",    label: "Create",    icon: Plus },
  { href: "/docs",      label: "Docs",      icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#7d00ff] to-[#00d4ff] flex items-center justify-center shadow-lg shadow-[#7d00ff]/30 group-hover:shadow-[#7d00ff]/50 group-hover:scale-105 transition-all">
            <Star className="w-5 h-5 text-white fill-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-white tracking-tight">SplitStar</span>
            <span className="text-[10px] text-gray-500 ml-1.5 uppercase tracking-wider">
              by Stellar
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm transition-all",
                pathname === href
                  ? "bg-gradient-to-r from-[#7d00ff]/20 to-[#00d4ff]/20 text-white border border-[#7d00ff]/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right: network badge + wallet */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#7de0ff] font-medium">
            {process.env.NEXT_PUBLIC_NETWORK ?? "testnet"}
          </span>
          <WalletButton />
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-white/5 flex overflow-x-auto">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors min-w-[64px]",
              pathname === href
                ? "text-[#b388ff]"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
