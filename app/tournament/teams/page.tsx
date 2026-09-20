"use client";

import Link from "next/link";
import { TournamentBrand } from "../components/tournament-brand";
import { useEffect, useState } from "react";

import {
  Team,
  teams as initialTeams,
} from "../../data/teams";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) =>
        word[0]?.toUpperCase(),
      )
      .join("") || "TM"
  );
}

export default function PublicTeamsPage() {
  const [teams, setTeams] = useState<Team[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadTeams() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/teams",
        {
          cache: "force-cache",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load registered teams.",
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid team data received.",
        );
      }

      setTeams(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load registered teams.",
      );

      setTeams(initialTeams);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  const sortedTeams = [...teams].sort(
    (a, b) => a.seed - b.seed,
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050810]/80 text-white"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(255,49,88,0.12),transparent_25%),radial-gradient(circle_at_88%_18%,rgba(39,217,255,0.10),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.10),transparent_35%)]" />
      <div className="relative mx-auto max-w-[1300px] px-5 py-8 sm:px-8">
        <header className="mb-8 border-b border-[#263750] pb-6">
          <Link
            href="/tournament"
            className="text-xs font-black uppercase tracking-[0.2em] text-[#52e2ff] transition hover:text-white"
          >
            ← Tournament Central
          </Link>

          <div className="mt-6">
            <TournamentBrand />
          </div>

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
            Registered Rosters
          </p>

          <h1 className="mt-2 bg-gradient-to-r from-white via-[#ffdce4] to-[#ff5275] bg-clip-text text-4xl font-black uppercase tracking-tight text-transparent">
            Teams
          </h1>

          <p className="mt-3 text-sm text-[#8195b0]">
            Official registered tournament
            rosters.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-[#ff3158]/30 bg-[#ff3158]/10 px-4 py-3 shadow-[0_0_25px_rgba(255,49,88,0.06)]">
              <p className="text-xs font-bold text-red-400">
                {error}
              </p>
            </div>
          )}
        </header>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-[#2b3d58] bg-white/[0.02] py-20 text-center">
            <p className="text-xs font-black uppercase tracking-wider text-white/25">
              Loading registered teams...
            </p>
          </div>
        ) : sortedTeams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2b3d58] bg-[#0b1220]/50 py-20 text-center">
            <p className="text-xs font-black uppercase tracking-wider text-white/25">
              No teams registered
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sortedTeams.map((team) => (
              <Link
                key={team.id}
                href={`/tournament/teams/${team.id}`}
                className="group overflow-hidden rounded-2xl border border-[#263750] bg-gradient-to-br from-[#0d1522] via-[#0a1019] to-[#111020] shadow-[0_12px_35px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#52e2ff]/50 hover:shadow-[0_18px_50px_rgba(39,217,255,0.10)]"
              >
                <div className="flex items-center gap-4 border-b border-white/[0.08] bg-white/[0.015] p-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#52e2ff]/25 bg-[#060b14] shadow-[0_0_22px_rgba(39,217,255,0.08)]">
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-lg font-black text-white/30">
                        {initials(team.name)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400">
                      Seed {team.seed}
                    </p>

                    <h2 className="mt-1 truncate text-xl font-black uppercase">
                      {team.name}
                    </h2>

                    <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/25">
                      {team.tag}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 border-b border-white/[0.08] bg-black/10">
                  <TeamStat
                    label="Wins"
                    value={team.wins}
                  />

                  <TeamStat
                    label="Losses"
                    value={team.losses}
                  />

                  <TeamStat
                    label="Players"
                    value={team.players.length}
                  />
                </div>

                <div className="p-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                    Captain / Rank
                  </p>

                  <p className="mt-2 text-xs font-bold text-white/60">
                    {team.captainRank ||
                      "Not specified"}
                  </p>

                  <div className="mt-4 space-y-1.5">
                    {team.players
                      .slice(0, 6)
                      .map(
                        (
                          player,
                          index,
                        ) => (
                          <div
                            key={
                              player.id
                            }
                            className="flex items-center justify-between border border-white/[0.06] bg-black/20 px-3 py-2"
                          >
                            <span className="truncate text-xs font-bold text-white/60">
                              {
                                player.name
                              }
                            </span>

                            <span className="ml-3 text-[8px] font-black text-white/15">
                              {String(
                                index +
                                  1,
                              ).padStart(
                                2,
                                "0",
                              )}
                            </span>
                          </div>
                        ),
                      )}
                  </div>

                  <p className="mt-4 text-right text-[9px] font-black uppercase tracking-wider text-cyan-400/60">
                    View Roster →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function TeamStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="border-r border-white/[0.08] p-4 text-center last:border-r-0">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/20">
        {label}
      </p>

      <p className="mt-1 text-lg font-black">
        {value}
      </p>
    </div>
  );
}