"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { TournamentBrand } from "./tournament-brand";

const NAV_LINKS = [
  { href: "/tournament",          label: "OVERVIEW" },
  { href: "/tournament/bracket",  label: "BRACKET" },
  { href: "/tournament/fixtures", label: "FIXTURES" },
  { href: "/tournament/matches",  label: "MATCHES" },
  { href: "/tournament/teams",    label: "TEAMS" },
  { href: "/tournament/players",  label: "LEADERBOARD" },
];

export function TournamentNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [status, setStatus] = useState<string>("LIVE");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d?.tournamentStatus) setStatus(d.tournamentStatus.toUpperCase());
      })
      .catch(() => {});
  }, []);

  const isActive = (href: string) =>
    href === "/tournament"
      ? pathname === "/tournament"
      : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e1e3a] bg-[#030308]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* ── Brand + Status ─────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Link href="/tournament" className="group flex items-center gap-3">
            {/* V logo box */}
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ff2d55]/40 bg-[#ff2d55]/10 text-sm font-black text-[#ff2d55] transition group-hover:border-[#ff2d55]/80 group-hover:bg-[#ff2d55]/20"
              style={{ boxShadow: "0 0 12px rgba(255,45,85,0.18)" }}
            >
              V
            </div>
            <TournamentBrand compact />
          </Link>

          {/* Status pill */}
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-black tracking-widest ${
              status === "LIVE"
                ? "border-[#ff2d55]/40 bg-[#ff2d55]/10 text-[#ff4d6a]"
                : "border-[#06b6d4]/40 bg-[#06b6d4]/10 text-[#22d3ee]"
            }`}
          >
            {status === "LIVE" && <span className="live-dot h-1.5 w-1.5 flex-shrink-0" />}
            {status}
          </span>
        </div>

        {/* ── Desktop Nav ────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2.5 text-[10px] font-black tracking-widest transition-colors duration-150 ${
                  active ? "text-[#ff2d55]" : "text-[#64748b] hover:text-[#f1f5f9]"
                }`}
              >
                {link.label}
                {active && (
                  <span
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#ff2d55]"
                    style={{ boxShadow: "0 0 8px #ff2d55" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Right controls ─────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#7c3aed]/50 bg-[#7c3aed]/10 px-3 py-1.5 text-[10px] font-black tracking-widest text-[#9d63ff] transition hover:bg-[#7c3aed]/25 hover:border-[#7c3aed]"
          >
            ADMIN ↗
          </Link>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg border border-[#1e1e3a] bg-[#0c0c18] p-2 text-[#64748b] hover:text-[#f1f5f9] transition md:hidden"
            aria-label="Toggle navigation menu"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-t border-[#1e1e3a] bg-[#030308] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-[10px] font-black tracking-widest transition ${
                    active
                      ? "bg-[#ff2d55]/10 text-[#ff4d6a]"
                      : "text-[#64748b] hover:bg-[#0c0c18] hover:text-[#f1f5f9]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-3 py-2.5 text-center text-[10px] font-black tracking-widest text-[#9d63ff]"
            >
              ADMIN HUB ↗
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
