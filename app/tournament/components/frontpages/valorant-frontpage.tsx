"use client";

import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "../ui/status-badge";
import { LiveStreamEmbed } from "../ui/live-stream-embed";
import type { FrontPageProps } from "./types";
import { getTournamentStatusMeta } from "@/lib/tournament-status";

export function ValorantFrontPage({
  settings,
  teams,
  matches,
  formatDate,
  game,
}: FrontPageProps) {
  const live = matches.filter((m) => m.status === "Live");
  const scheduled = matches.filter((m) => m.status === "Scheduled");

  const upcomingMatches = [...live, ...scheduled]
    .sort((a, b) => {
      if (a.status === "Live" && b.status !== "Live") return -1;
      if (b.status === "Live" && a.status !== "Live") return 1;
      return (
        new Date(a.scheduledAt || "9999").getTime() -
        new Date(b.scheduledAt || "9999").getTime()
      );
    })
    .slice(0, 2);

  return (
    <div className="space-y-8">
      {/* ══════════════════════════════════════════════════════════════════
          1. EPIC CINEMATIC HERO ARENA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(148,163,184,0.1)]">
        {/* Radial gradient backing */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#2e2e5a]/15 blur-[100px]" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-[#ff2d55]/10 blur-[100px]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
          {/* Left: Tournament Identity */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-[#2e2e5a]/40 bg-[#2e2e5a]/10 px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#94a3b8]">
                {game.shortName} ESPORTS
              </span>
              <span className="rounded-full border border-[#ff2d55]/40 bg-[#ff2d55]/10 px-3 py-1 text-[12px] font-black uppercase tracking-widest text-[#ff4d6a]">
                SEASON 2026
              </span>
              {settings?.tournamentStatus && (
                <span
                  className={`rounded-full border px-3 py-1 text-[12px] font-black uppercase tracking-widest ${
                    getTournamentStatusMeta(settings.tournamentStatus).badgeClass
                  }`}
                >
                  ● {getTournamentStatusMeta(settings.tournamentStatus).display}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.05]">
              {settings?.tournamentName || "XMD VALORANT"}
            </h1>

            <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-[#94a3b8] sm:text-base">
              {settings?.tagline || "ONE GAME ONE SQUAD XMD FAMILY"}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-[#94a3b8] border-t border-[#1e1e3a]/80 pt-5">
              <div className="flex items-center gap-2">
                <span className="text-[#94a3b8]">📅</span>
                <span>
                  <strong className="text-white">SCHEDULE:</strong>{" "}
                  {settings?.startDate
                    ? formatDate(settings.startDate).split(",")[0]
                    : "OCT 3"}{" "}
                  –{" "}
                  {settings?.endDate
                    ? formatDate(settings.endDate).split(",")[0]
                    : "OCT 23"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#ff2d55]">🛡️</span>
                <span>
                  <strong className="text-white">ORGANIZER:</strong>{" "}
                  {settings?.organizerName || "XMD FAMILY"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Official Prize Pool Showcase */}
          <div className="relative overflow-hidden rounded-2xl border border-[#ff2d55]/40 bg-gradient-to-b from-[#ff2d55]/15 via-[#0c0c18] to-[#080812] p-5 shadow-[0_0_35px_rgba(255,45,85,0.15)]">
            {/* Header Strip */}
            <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span className="text-sm font-black uppercase tracking-widest text-[#fbbf24]">
                  PRIZE POOL ({settings?.prizePool ? `₹${settings.prizePool}` : "OFFICIAL"})
                </span>
              </div>
              <span className="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2.5 py-0.5 text-[11px] font-black uppercase text-[#fbbf24]">
                OFFICIAL BREAKDOWN
              </span>
            </div>

            {/* Graphic Artwork / Podium Card */}
            <div className="mt-4 overflow-hidden rounded-xl border border-[#1e1e3a] shadow-inner transition hover:border-[#ff2d55]/50 hover:shadow-[0_0_25px_rgba(255,45,85,0.2)]">
              {settings?.bannerUrl ? (
                <Image
                  src={settings.bannerUrl}
                  alt="Official Prize Pool"
                  width={592}
                  height={185}
                  unoptimized
                  className="block h-auto w-full object-cover"
                />
              ) : (
                <Image
                  src="/prizepool-breakdown.png"
                  alt="Official Prize Pool 6K"
                  width={592}
                  height={185}
                  unoptimized
                  className="block h-auto w-full object-cover"
                />
              )}
            </div>
          </div>
        </div>

        {/* Announcement ticker if set */}
        {settings?.announcement && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-3.5 text-sm text-[#fde68a]">
            <span className="text-base font-black">📢</span>
            <span className="font-bold">{settings.announcement}</span>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. LIVE BROADCAST EMBED
      ══════════════════════════════════════════════════════════════════ */}
      <LiveStreamEmbed url={settings?.liveStreamUrl} />

      {/* ══════════════════════════════════════════════════════════════════
          3. UPCOMING MATCHES
      ══════════════════════════════════════════════════════════════════ */}
      {upcomingMatches.length > 0 && (
        <section className="relative overflow-hidden rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 backdrop-blur-xl shadow-[0_0_40px_rgba(148,163,184,0.08)] divide-y divide-[#1e1e3a]">
          {upcomingMatches.map((m) => {
            const team1 = teams.find((t) => t.id === m.team1Id);
            const team2 = teams.find((t) => t.id === m.team2Id);

            return (
              <div key={m.id} className="p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 text-sm font-black text-white">
                      M{String(m.matchNumber).padStart(2, "0")}
                    </span>
                    <span className="rounded-lg border border-[#2e2e5a]/40 bg-[#2e2e5a]/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#94a3b8]">
                      {m.stage}
                    </span>
                    <span className="rounded-lg border border-[#1e1e3a] bg-[#080812] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#94a3b8]">
                      {m.map || "TBD"} • BO{m.bestOf}
                    </span>
                  </div>

                  <StatusBadge status={m.status} />
                </div>

                <div className="mt-6 grid items-center gap-6 grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
                  {/* Team 1 */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18] shadow-[0_0_20px_rgba(148,163,184,0.15)]">
                      {team1?.logo ? (
                        <Image
                          src={team1.logo}
                          alt={team1.name}
                          width={56}
                          height={56}
                          unoptimized
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-sm font-black text-[#94a3b8]">
                          {(team1?.tag ?? "TBD").slice(0, 3)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                        {team1?.name ?? "TBD"}
                      </h4>
                      <p className="mt-0.5 text-sm font-bold text-[#64748b]">
                        [{team1?.tag ?? "TBD"}] • Seed #{team1?.seed ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Center Hub */}
                  <div className="flex flex-col items-center justify-center py-2 md:py-0 px-6">
                    <div className="rounded-2xl border border-[#2e2e5a]/40 bg-[#2e2e5a]/15 px-5 py-2 text-sm font-black tracking-widest text-[#f1f5f9] shadow-[0_0_20px_rgba(148,163,184,0.25)]">
                      VS
                    </div>
                    <span className="mt-2 text-sm font-black uppercase tracking-wider text-[#94a3b8]">
                      {formatDate(m.scheduledAt)}
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div className="flex items-center gap-4 md:flex-row-reverse md:text-right">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18] shadow-[0_0_20px_rgba(148,163,184,0.15)]">
                      {team2?.logo ? (
                        <Image
                          src={team2.logo}
                          alt={team2.name}
                          width={56}
                          height={56}
                          unoptimized
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-sm font-black text-[#94a3b8]">
                          {(team2?.tag ?? "TBD").slice(0, 3)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                        {team2?.name ?? "TBD"}
                      </h4>
                      <p className="mt-0.5 text-sm font-bold text-[#64748b]">
                        [{team2?.tag ?? "TBD"}] • Seed #{team2?.seed ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[#1e1e3a] pt-4">
                  <span className="text-sm text-[#64748b]">
                    Featured Match Stream & Scoreboard Telemetry
                  </span>
                  <Link
                    href={`/tournament/matches/${encodeURIComponent(m.id)}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#2e2e5a]/40 bg-[#2e2e5a]/10 px-4 py-2 text-sm font-black uppercase tracking-wider text-[#94a3b8] transition hover:bg-[#2e2e5a]/20"
                  >
                    <span>OPEN MATCH TELEMETRY</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          4. SPONSORS & OFFICIAL PARTNERS - MODERN 4-CARD DECK
      ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
                OFFICIAL PARTNERS
              </span>
              <span className="rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-black uppercase text-[#fbbf24]">
                4 CHAMPIONSHIP SPONSORS
              </span>
            </div>
            <h4 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">
              Tournament Sponsors
            </h4>
          </div>
          <span className="rounded-full border border-[#1e1e3a] bg-[#080812] px-3.5 py-1 text-[12px] font-black text-[#94a3b8]">
            PRESENTED BY XMD FAMILY
          </span>
        </div>

        {/* 4 Equal-Weight Sponsor Cards */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              name: "Sheikh Kunjappu",
              role: "Title Partner & Championship Patron",
              image: "/sponsors/sheikh-kunjappu.jpg",
              fit: "object-cover",
            },
            {
              name: "OSDF Clan",
              role: "Official Clan & Community Sponsor",
              image: "/sponsors/osdf-clan.png",
              fit: "object-contain p-3",
            },
            {
              name: "Deuz X Gaming",
              role: "Esports Media & Gaming Partner",
              image: "/sponsors/deuz-x.png",
              fit: "object-contain p-2.5",
            },
            {
              name: "Agon Desantos",
              role: "Championship Supporter & Sponsor",
              image: "/sponsors/agon-desantos.png",
              fit: "object-contain p-1",
            },
          ].map((sponsor) => (
            <div
              key={sponsor.name}
              className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/80 p-6 text-center transition hover:border-white/50 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]"
            >
              <span className="rounded-full border border-[#1e1e3a] bg-[#080812] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">
                OFFICIAL SPONSOR
              </span>

              <div className="my-5 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#94a3b8]/40 bg-[#080812] shadow-[0_0_25px_rgba(255,255,255,0.1)] transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={sponsor.image}
                  alt={sponsor.name}
                  width={112}
                  height={112}
                  unoptimized
                  className={`h-full w-full ${sponsor.fit}`}
                />
              </div>

              <div>
                <h5 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[#f1f5f9] transition-colors">
                  {sponsor.name}
                </h5>
                <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-[#64748b]">
                  {sponsor.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          5. OFFICIAL CASTERS / BROADCAST TALENT
      ══════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-[#1e1e3a] bg-[#0c0c18]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e3a] pb-5">
          <div>
            <span className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
              BROADCAST TALENT
            </span>
            <h4 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">
              Official Casters
            </h4>
          </div>
          <span className="rounded-full border border-[#1e1e3a] bg-[#080812] px-3.5 py-1 text-[12px] font-black text-[#94a3b8]">
            WATCH ON YOUTUBE
          </span>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((slot) => (
            <a
              key={slot}
              href="#"
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#1e1e3a] bg-[#080812]/60 p-6 text-center transition hover:border-[#ff2d55]/50 hover:bg-[#080812]"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[#1e1e3a] bg-[#0c0c18] text-2xl text-[#64748b] transition group-hover:border-[#ff2d55]/50 group-hover:text-[#ff4d6a]">
                ▶
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-[#94a3b8] group-hover:text-white transition-colors">
                  Caster Slot {slot}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  YouTube channel link coming soon
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
