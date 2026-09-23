"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TournamentNav } from "../../components/tournament-nav";

type Player = {
  id: string;
  name: string;
  role?: string;
};

type Team = {
  id: string;
  name: string;
  tag: string;
  seed: number;
  logo?: string;
  wins: number;
  losses: number;
  captainRank?: string;
  players: Player[];
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "TM"
  );
}

export default function PublicTeamDetailsPage() {
  const params = useParams();

  const teamId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadTeam() {
      if (!teamId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/teams/${encodeURIComponent(teamId)}`, {
          cache: "no-store",
        });
        const foundTeam = response.ok ? await response.json() : null;

        if (!mounted) {
          setLoading(false);
          return;
        }

        if (!foundTeam) {
          setTeam(null);
          return;
        }

        setTeam({
          ...foundTeam,
          wins: Number(foundTeam.wins ?? 0),
          losses: Number(foundTeam.losses ?? 0),
          seed: Number(foundTeam.seed ?? 0),
          players: Array.isArray(foundTeam.players) ? foundTeam.players : [],
        });
      } catch (loadError) {
        if (!mounted) {
          setLoading(false);
          return;
        }
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load team.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeam();

    return () => {
      mounted = false;
    };
  }, [teamId]);

  return (
    <div className="relative min-h-screen text-[#f1f5f9] pb-20">
      {/* ── Ambient Neon Glow Orbs ────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#94a3b8]/12 blur-[180px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#ff2d55]/10 blur-[160px]" />
        <div className="absolute bottom-10 left-1/3 h-[500px] w-[500px] rounded-full bg-[#94a3b8]/8 blur-[160px]" />
      </div>

      <TournamentNav />

      <main className="relative z-10 mx-auto max-w-[1440px] px-4 pt-6 sm:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#1e1e3a] pb-4">
          <Link
            href="/tournament/teams"
            className="inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-widest text-[#94a3b8] transition hover:text-[#f1f5f9]"
          >
            <span>← ALL TEAMS</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/tournament/matches"
              className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/90 px-3.5 py-2 text-[12px] font-black uppercase tracking-widest text-[#94a3b8] transition hover:border-[#94a3b8]/50 hover:text-white"
            >
              FIXTURES ↗
            </Link>
            <Link
              href="/tournament"
              className="rounded-xl border border-[#1e1e3a] bg-[#0c0c18]/90 px-3.5 py-2 text-[12px] font-black uppercase tracking-widest text-[#94a3b8] transition hover:border-[#94a3b8]/50 hover:text-[#f1f5f9]"
            >
              STANDINGS ↗
            </Link>
          </div>
        </div>

        {loading ? (
          <section className="animate-pulse rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-8 backdrop-blur-xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="h-28 w-28 rounded-2xl bg-white/5" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-24 rounded bg-white/10" />
                <div className="h-10 w-64 rounded bg-white/10" />
                <div className="h-4 w-40 rounded bg-white/5" />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#1e1e3a] pt-6">
              <div className="h-16 rounded-xl bg-white/5" />
              <div className="h-16 rounded-xl bg-white/5" />
              <div className="h-16 rounded-xl bg-white/5" />
            </div>
          </section>
        ) : error ? (
          <div className="rounded-2xl border border-[#ff2d55]/40 bg-[#ff2d55]/10 p-12 text-center backdrop-blur-xl">
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
              Database Error
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase text-white">
              Unable to load team
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#94a3b8]">
              {error}
            </p>
            <Link
              href="/tournament/teams"
              className="mt-6 inline-flex rounded-xl border border-[#ff2d55]/40 bg-[#ff2d55]/15 px-6 py-3 text-sm font-black uppercase tracking-wider text-[#ff4d6a] transition hover:bg-[#ff2d55]/25"
            >
              ← Return to Teams
            </Link>
          </div>
        ) : !team ? (
          <div className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-12 text-center backdrop-blur-xl">
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#ff4d6a]">
              Not Found
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase text-white">
              Team Not Found
            </h1>
            <p className="mt-3 text-sm text-[#64748b]">
              The requested team could not be found in the tournament registry.
            </p>
            <Link
              href="/tournament/teams"
              className="mt-6 inline-flex rounded-xl border border-[#1e1e3a] bg-[#0c0c18] px-6 py-3 text-sm font-black uppercase tracking-wider text-[#f1f5f9] transition hover:border-[#94a3b8]"
            >
              ← Browse All Teams
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Team Hero Section */}
            <section className="relative overflow-hidden rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(148,163,184,0.06)] sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {/* Team Logo / Avatar */}
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#94a3b8]/40 bg-[#080812] shadow-[0_0_30px_rgba(148,163,184,0.2)]">
                  {team.logo ? (
                    <Image
                      src={team.logo}
                      alt={`${team.name} logo`}
                      width={112}
                      height={112}
                      unoptimized
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-3xl font-black text-[#94a3b8]">
                      {initials(team.name)}
                    </span>
                  )}
                </div>

                {/* Team Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#94a3b8]/40 bg-[#94a3b8]/10 px-3 py-1 text-[12px] font-black uppercase tracking-wider text-[#f1f5f9]">
                      Seed #{team.seed}
                    </span>
                    <span className="rounded-full border border-[#94a3b8]/40 bg-[#94a3b8]/10 px-3 py-1 text-[12px] font-black uppercase tracking-wider text-[#f1f5f9]">
                      [{team.tag}]
                    </span>
                  </div>

                  <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-[#f1f5f9] sm:text-5xl">
                    {team.name}
                  </h1>

                  <p className="mt-1.5 text-sm font-bold uppercase tracking-widest text-[#64748b]">
                    Official Tournament Franchise
                  </p>
                </div>
              </div>

              {/* Stat Strip */}
              <div className="mt-8 grid grid-cols-3 divide-x divide-[#1e1e3a] border-t border-[#1e1e3a] pt-6">
                <div className="text-center">
                  <p className="text-[12px] font-black uppercase tracking-widest text-[#64748b]">
                    Victories
                  </p>
                  <p className="mt-1.5 text-2xl font-black text-[#34d399] sm:text-3xl">
                    {team.wins}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-[12px] font-black uppercase tracking-widest text-[#64748b]">
                    Defeats
                  </p>
                  <p className="mt-1.5 text-2xl font-black text-[#ff4d6a] sm:text-3xl">
                    {team.losses}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-[12px] font-black uppercase tracking-widest text-[#64748b]">
                    Roster Size
                  </p>
                  <p className="mt-1.5 text-2xl font-black text-[#f1f5f9] sm:text-3xl">
                    {team.players.length}
                  </p>
                </div>
              </div>
            </section>

            {/* Captain & Rank Info */}
            <section className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                    LEADERSHIP
                  </p>
                  <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                    Captain & Competitive Tier
                  </h2>
                </div>
                <span className="rounded-full border border-[#94a3b8]/30 bg-[#94a3b8]/10 px-3 py-1 text-[11px] font-black text-[#f1f5f9]">
                  LEADER
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#1e1e3a] bg-[#080812]/60 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 text-sm font-black text-[#f59e0b]">
                  ★
                </span>
                <div>
                  <p className="text-[12px] font-black uppercase tracking-wider text-[#64748b]">
                    Assigned Rank / In-Game Lead
                  </p>
                  <p className="text-base font-black text-[#f1f5f9]">
                    {team.captainRank || "Unassigned"}
                  </p>
                </div>
              </div>
            </section>

            {/* Roster Lineup */}
            <section className="rounded-2xl border border-[#1e1e3a] bg-[#0c0c18]/85 p-6 backdrop-blur-xl sm:p-8">
              <div className="flex items-center justify-between border-b border-[#1e1e3a] pb-4">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#94a3b8]">
                    ACTIVE ROSTER
                  </p>
                  <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#f1f5f9]">
                    Players ({team.players.length})
                  </h2>
                </div>
                <span className="rounded-full border border-[#94a3b8]/30 bg-[#94a3b8]/10 px-3 py-1 text-[11px] font-black text-[#f1f5f9]">
                  LINEUP
                </span>
              </div>

              {team.players.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[#1e1e3a] p-10 text-center text-sm text-[#64748b]">
                  No players registered in roster yet.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {team.players.map((player, index) => (
                    <div
                      key={player.id || index}
                      className="group flex items-center justify-between rounded-xl border border-[#1e1e3a] bg-[#080812]/80 p-4 transition hover:border-[#94a3b8]/50 hover:bg-[#0c0c18] hover:shadow-[0_0_20px_rgba(148,163,184,0.1)]"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#1e1e3a] bg-[#0c0c18] text-sm font-black text-[#94a3b8] group-hover:border-[#94a3b8]/40 group-hover:text-[#f1f5f9]">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div>
                          <p className="text-sm font-black uppercase tracking-tight text-[#f1f5f9]">
                            {player.name}
                          </p>
                          <span className="mt-1 inline-flex rounded border border-[#94a3b8]/30 bg-[#94a3b8]/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#f1f5f9]">
                            {player.role || "Flex"}
                          </span>
                        </div>
                      </div>

                      <span className="text-sm font-black text-[#475569] transition group-hover:text-[#94a3b8]">
                        →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <Link
                href="/tournament/teams"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1e1e3a] bg-[#0c0c18] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#94a3b8] transition hover:border-[#94a3b8]/50 hover:text-white"
              >
                <span>← All Teams</span>
              </Link>

              <Link
                href="/tournament/matches"
                className="inline-flex items-center gap-2 rounded-xl border border-[#94a3b8]/40 bg-[#94a3b8]/10 px-6 py-3 text-sm font-black uppercase tracking-wider text-[#f1f5f9] transition hover:bg-[#94a3b8]/20 hover:shadow-[0_0_20px_rgba(148,163,184,0.2)]"
              >
                <span>View Tournament Matches →</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}