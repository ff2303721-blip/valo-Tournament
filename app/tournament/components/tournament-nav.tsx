"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { TournamentBrand } from "./tournament-brand";

const NAV_LINKS = [
  { href: "/tournament", label: "OVERVIEW" },
  { href: "/tournament/bracket", label: "BRACKET" },
  { href: "/tournament/fixtures", label: "FIXTURES" },
  { href: "/tournament/matches", label: "MATCHES" },
  { href: "/tournament/teams", label: "TEAMS" },
  { href: "/tournament/players", label: "LEADERBOARD" },
];

export function TournamentNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [status, setStatus] = useState<string>("LIVE");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.tournamentStatus) {
          setStatus(data.tournamentStatus.toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e2a38] bg-[#080c12]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Live Indicator */}
        <div className="flex items-center gap-4">
          <Link href="/tournament" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-[#ff4655]/40 bg-[#ff4655]/10 text-[#ff4655] font-black shadow-[0_0_15px_rgba(255,70,85,0.25)] transition group-hover:scale-105 group-hover:border-[#ff4655]">
              V
            </div>
            <TournamentBrand compact />
          </Link>

          <span
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${
              status === "LIVE"
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === "LIVE" ? "animate-pulse bg-red-400" : "bg-cyan-400"
              }`}
            />
            {status}
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/tournament"
                ? pathname === "/tournament"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 text-xs font-black tracking-widest transition-colors ${
                  isActive
                    ? "text-[#ff4655]"
                    : "text-[#8da5c1] hover:text-white"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#ff4655] shadow-[0_0_8px_#ff4655]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 rounded border border-[#ff4655]/60 bg-[#ff4655]/15 px-3 py-1.5 text-xs font-bold tracking-wider text-[#ff707e] transition hover:bg-[#ff4655] hover:text-white"
          >
            ADMIN HUB ↗
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded border border-[#273549] bg-[#0e141f] p-2 text-[#8da5c1] hover:text-white md:hidden"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-[#1e2a38] bg-[#0c1119] px-4 py-3 md:hidden">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/tournament"
                  ? pathname === "/tournament"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded px-3 py-2 text-xs font-bold tracking-wider transition ${
                    isActive
                      ? "bg-[#ff4655]/15 text-[#ff4655]"
                      : "text-[#8da5c1] hover:bg-[#141d2a] hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 block rounded border border-[#ff4655]/50 bg-[#ff4655]/10 px-3 py-2 text-center text-xs font-bold text-[#ff4655]"
            >
              ADMIN HUB ↗
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
