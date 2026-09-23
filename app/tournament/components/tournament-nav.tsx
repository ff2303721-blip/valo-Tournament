"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { TournamentBrand } from "./tournament-brand";
import { getGameDefinition } from "@/lib/games/registry";
import { getTournamentStatusMeta } from "@/lib/tournament-status";

const NAV_LINKS = [
  { href: "/tournament",          label: "OVERVIEW" },
  { href: "/tournament/bracket",  label: "BRACKET" },
  { href: "/tournament/matches",  label: "MATCHES" },
  { href: "/tournament/teams",    label: "TEAMS" },
  { href: "/tournament/players",  label: "LEADERBOARD" },
];

let cachedNavSettings: { status?: string; gameId?: string; logoUrl?: string } | null = null;

export function TournamentNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [status, setStatus] = useState<string | undefined>(cachedNavSettings?.status);
  const [gameId, setGameId] = useState<string>(cachedNavSettings?.gameId || "valorant");
  const [logoUrl, setLogoUrl] = useState<string>(cachedNavSettings?.logoUrl || "");

  useEffect(() => {
    if (cachedNavSettings) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const nextStatus = d?.tournamentStatus as string | undefined;
        const nextGameId = d?.gameId || "valorant";
        const nextLogoUrl = d?.logoUrl || "";
        cachedNavSettings = { status: nextStatus, gameId: nextGameId, logoUrl: nextLogoUrl };
        setStatus(nextStatus);
        setGameId(nextGameId);
        setLogoUrl(nextLogoUrl);
      })
      .catch(() => {});
  }, []);

  const statusMeta = getTournamentStatusMeta(status);

  const game = getGameDefinition(gameId);

  const isActive = (href: string) =>
    href === "/tournament"
      ? pathname === "/tournament"
      : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-[#ff2d55]/20 bg-[#030308]/95 backdrop-blur-2xl transition-all duration-300 shadow-[0_4px_40px_rgba(0,0,0,0.7)]">
      {/* Top accent strip */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#ff2d55] via-[#ff4d6a] to-[#ff2d55]" />
      {/* Micro-ambient bottom border glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff2d55]/40 to-transparent" />

      <div className="mx-auto flex max-w-[1680px] items-center justify-between px-4 py-3.5 sm:px-6">
        {/* ── 1. Brand & Game Identity ──────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Link href="/tournament" className="group flex items-center gap-3">
            {/* Dynamic Game Icon / Logo Box */}
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-12 w-12 rounded-xl border border-[#ff2d55]/30 bg-[#0c0c18] object-contain p-1 shadow-[0_0_20px_rgba(255,45,85,0.2)] transition group-hover:border-[#ff2d55]/60 group-hover:scale-105"
              />
            ) : (
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#ff2d55]/30 bg-gradient-to-b from-[#ff2d55]/15 to-[#0c0c18] text-lg font-black text-white shadow-[0_0_20px_rgba(255,45,85,0.2)] transition-transform duration-200 group-hover:scale-105 group-hover:border-[#ff2d55]/60">
                <span className="drop-shadow-[0_0_8px_rgba(255,45,85,0.5)]">
                  {game.icon}
                </span>
              </div>
            )}
            <TournamentBrand compact />
          </Link>

          {/* Pulse Status Badge */}
          <div
            className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-mono font-bold tracking-widest uppercase transition ${statusMeta.badgeClass}`}
          >
            <span className="relative flex h-2 w-2">
              {statusMeta.isLive && (
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${statusMeta.dotClass}`} />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
            </span>
            <span>
              {statusMeta.label}
              {statusMeta.sublabel ? ` · ${statusMeta.sublabel}` : ""}
            </span>
          </div>
        </div>

        {/* ── 2. Modern Floating Capsule Nav ──────────────────────────── */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-xl shadow-inner">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-4 py-1.5 text-[13px] font-bold tracking-wider uppercase transition-all duration-200 ${
                  active
                    ? "bg-[#ff2d55]/20 text-white border border-[#ff2d55]/50 shadow-[0_2px_16px_rgba(255,45,85,0.35)]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ── 3. Right Action Pill & Mobile Toggle ───────────────────── */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#ff2d55]/50 bg-gradient-to-r from-[#ff2d55]/25 via-[#ff4d6a]/15 to-[#ff2d55]/25 px-4 py-1.5 text-[13px] font-black tracking-wider text-[#ff8fa3] transition-all duration-200 hover:border-[#ff2d55] hover:bg-[#ff2d55]/40 hover:text-white hover:shadow-[0_0_20px_rgba(255,45,85,0.4)] hover:scale-[1.02]"
          >
            <span className="text-[12px] text-[#ff4d6a]">⚡</span>
            <span>ADMIN HUB</span>
            <span className="text-[12px] text-[#ff4d6a]">↗</span>
          </Link>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/20 transition md:hidden"
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
        <div className="border-t border-white/[0.08] bg-[#030308]/95 px-4 py-4 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold tracking-wider uppercase transition ${
                    active
                      ? "bg-[#ff2d55]/20 text-white border border-[#ff2d55]/50"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-[#ff2d55]/50 bg-[#ff2d55]/25 px-4 py-2.5 text-sm font-black tracking-wider text-[#ff8fa3]"
            >
              <span>⚡ ADMIN HUB</span>
              <span>↗</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
