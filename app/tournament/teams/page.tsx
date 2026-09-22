"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { TournamentNav } from "../components/tournament-nav";
import type { Team } from "@/lib/types";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "TM"
  );
}

function TeamStatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="border-r border-[#1e1e3a] p-3.5 text-center last:border-r-0">
      <p className="text-[8px] font-black uppercase tracking-widest text-[#475569]">
        {label}
      </p>
      <p className={`mt-1 text-lg font-black ${accent ?? "text-[#f1f5f9]"}`}>
        {value}
      </p>
    </div>
  );
}

export default function PublicTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchTeams() {
      try {
        const res = await fetch("/api/teams?lite=1", { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to load registered teams.");
        const data = await res.json();
        if (active && Array.isArray(data)) setTeams(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load teams");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchTeams();
    return () => {
      active = false;
    };
  }, []);

  const sortedTeams = [...teams].sort((a, b) => a.seed - b.seed);

  return (
    <div className="min-h-screen text-[#f1f5f9]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#7c3aed]/7 blur-[160px]" />
        <div className="absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-[#06b6d4]/6 blur-[140px]" />
      </div>

      <TournamentNav />

      <main className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Page header */}
        <header className="mb-8 border-b border-[#1e1e3a] pb-6">
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#06b6d4]">
            Registered Rosters
          </div>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">Teams</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Official registered tournament rosters and franchise lineups.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-[#ff2d55]/30 bg-[#ff2d55]/8 px-4 py-3">
              <p className="text-xs font-bold text-[#ff4d6a]">{error}</p>
            </div>
          )}
        </header>

        {loading ? (
          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/80 py-24 text-center backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-widest text-[#64748b]">
              Loading registered teams…
            </p>
          </div>
        ) : sortedTeams.length === 0 ? (
          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/80 py-24 text-center backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-widest text-[#64748b]">
              No teams registered
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sortedTeams.map((team) => {
              const captainClean = (team.captainRank || "").trim().toLowerCase();

              return (
                <Link
                  key={team.id}
                  href={`/tournament/teams/${team.id}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 backdrop-blur-xl transition hover:border-[#7c3aed]/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]"
                >
                  <div>
                    {/* Team header */}
                    <div className="flex items-center gap-4 border-b border-[#1e1e3a] p-5">
                      {/* Logo / Avatar */}
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1e1e3a] bg-[#030308]"
                        style={{ boxShadow: "inset 0 0 12px rgba(124,58,237,0.08)" }}
                      >
                        {team.logo ? (
                          <Image
                            src={team.logo}
                            alt={team.name}
                            width={56}
                            height={56}
                            unoptimized
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-base font-black text-[#7c3aed]">
                            {initials(team.name)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#a78bfa]">
                            SEED #{team.seed}
                          </span>
                          <span className="rounded border border-[#1e1e3a] bg-[#030308] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#64748b]">
                            [{team.tag}]
                          </span>
                        </div>
                        <h2 className="mt-1.5 truncate text-lg font-black uppercase tracking-tight text-[#f1f5f9] group-hover:text-white">
                          {team.name}
                        </h2>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 border-b border-[#1e1e3a] bg-[#080812]/50">
                      <TeamStatBox
                        label="Wins"
                        value={team.wins}
                        accent="text-[#34d399]"
                      />
                      <TeamStatBox
                        label="Losses"
                        value={team.losses}
                        accent="text-[#ff4d6a]"
                      />
                      <TeamStatBox
                        label="Players"
                        value={team.players.length}
                        accent="text-[#06b6d4]"
                      />
                    </div>

                    {/* Roster Container */}
                    <div className="p-5">
                      {/* Captain Banner */}
                      {team.captainRank && (
                        <div className="mb-3.5 flex items-center justify-between rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#f59e0b]">★</span>
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#f59e0b]">
                              CAPTAIN
                            </span>
                          </div>
                          <span className="text-xs font-black uppercase tracking-tight text-[#fbbf24]">
                            {team.captainRank}
                          </span>
                        </div>
                      )}

                      {/* 2-Column Compact Roster Grid */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {team.players.slice(0, 6).map((player, i) => {
                          const isCaptain =
                            (
                              captainClean &&
                              player.name &&
                              (captainClean.includes(player.name.toLowerCase()) ||
                                player.name.toLowerCase().includes(captainClean))
                            ) || (player.role ? /captain|igl/i.test(player.role) : false);

                          const isLastOdd =
                            team.players.length % 2 !== 0 &&
                            i === team.players.length - 1;

                          return (
                            <div
                              key={player.id || i}
                              className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition ${
                                isLastOdd ? "col-span-2" : ""
                              } ${
                                isCaptain
                                  ? "border-[#f59e0b]/50 bg-[#f59e0b]/10 text-[#fbbf24] shadow-[0_0_12px_rgba(245,158,11,0.12)]"
                                  : "border-[#1e1e3a] bg-[#030308]/90 text-[#94a3b8] group-hover:border-[#2e2e5a]"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[8px] font-black ${
                                    isCaptain
                                      ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                                      : "bg-[#0c0c18] text-[#475569]"
                                  }`}
                                >
                                  {i + 1}
                                </span>
                                <span
                                  className={`truncate text-[11px] font-bold uppercase tracking-tight ${
                                    isCaptain ? "text-[#fbbf24]" : "text-[#f1f5f9]"
                                  }`}
                                >
                                  {player.name}
                                </span>
                              </div>

                              {isCaptain && (
                                <span className="ml-1 shrink-0 rounded bg-[#f59e0b]/25 px-1 py-0.5 text-[8px] font-black uppercase text-[#fbbf24]">
                                  ★ CPT
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Integrated Card Footer */}
                  <div className="flex items-center justify-between border-t border-[#1e1e3a] bg-[#080812]/90 px-5 py-2.5 text-xs font-black tracking-widest text-[#7c3aed] transition-colors group-hover:bg-[#7c3aed]/15 group-hover:text-[#a78bfa]">
                    <span className="text-[10px] uppercase">Roster Telemetry</span>
                    <span className="flex items-center gap-1 text-[11px]">
                      VIEW ROSTER{" "}
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}