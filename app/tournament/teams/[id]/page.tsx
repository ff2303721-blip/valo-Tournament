"use client";

import Link from "next/link";
import { TournamentBrand } from "../components/tournament-brand";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
    typeof params.id === "string"
      ? params.id
      : "";

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadTeam() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/teams",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load tournament teams.",
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid team data received.",
          );
        }

        if (cancelled) {
          return;
        }

        const foundTeam = data.find(
          (item: Team) =>
            item.id === teamId,
        );

        if (!foundTeam) {
          setTeam(null);
          return;
        }

        setTeam({
          ...foundTeam,
          wins: Number(
            foundTeam.wins ?? 0,
          ),
          losses: Number(
            foundTeam.losses ?? 0,
          ),
          seed: Number(
            foundTeam.seed ?? 0,
          ),
          players: Array.isArray(
            foundTeam.players,
          )
            ? foundTeam.players
            : [],
        });
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load team.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTeam();

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#060a12] text-white">
        <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
          <header className="mb-8 border-b border-white/10 pb-6">
            <Link
              href="/tournament/teams"
              className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 transition hover:text-white"
            >
              ← All Teams
            </Link>
          </header>

          <section className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.06] via-white/[0.03] to-purple-500/[0.06] p-8 shadow-[0_0_60px_rgba(34,211,238,0.05)]">
            <div className="animate-pulse">
              <div className="h-5 w-24 rounded bg-white/10" />

              <div className="mt-4 h-12 w-72 rounded bg-white/10" />

              <div className="mt-3 h-4 w-40 rounded bg-white/10" />

              <div className="mt-8 h-24 rounded-xl bg-white/5" />
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#060a12] text-white">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
            Database Error
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase">
            Team unavailable
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/40">
            {error}
          </p>

          <Link
            href="/tournament/teams"
            className="mt-8 inline-block rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-[10px] font-black uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-400/20"
          >
            ← All Teams
          </Link>
        </div>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="min-h-screen bg-[#060a12] text-white">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
            Team Not Found
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase">
            Team unavailable
          </h1>

          <p className="mt-4 text-sm text-white/40">
            This team does not exist in the tournament database.
          </p>

          <Link
            href="/tournament/teams"
            className="mt-8 inline-block rounded-lg border border-white/10 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-cyan-300"
          >
            ← All Teams
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060a12] text-white">
      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/tournament/teams"
            className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 transition hover:text-cyan-300"
          >
            ← All Teams
          </Link>

          <Link
            href="/tournament"
            className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 transition hover:text-white"
          >
            Tournament Central
          </Link>
        </header>

        <section className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.08] via-white/[0.03] to-purple-500/[0.08] shadow-[0_0_70px_rgba(34,211,238,0.06)]">
          <div className="flex flex-col gap-7 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/20 bg-black/30 shadow-[0_0_35px_rgba(34,211,238,0.08)]">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt={`${team.name} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-3xl font-black text-cyan-300/60">
                  {initials(team.name)}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                  Seed {team.seed}
                </span>

                <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
                  {team.tag}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
                {team.name}
              </h1>

              <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-white/30">
                Official Tournament Roster
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-white/10">
            <Stat
              label="Wins"
              value={team.wins}
              accent="text-emerald-300"
            />

            <Stat
              label="Losses"
              value={team.losses}
              accent="text-red-300"
            />

            <Stat
              label="Players"
              value={team.players.length}
              accent="text-cyan-300"
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
              Team Information
            </p>

            <h2 className="mt-1 text-2xl font-black uppercase">
              Captain / Rank
            </h2>
          </div>

          <div className="rounded-xl border border-purple-400/20 bg-gradient-to-r from-purple-500/[0.07] to-cyan-500/[0.04] p-5">
            <p className="text-sm font-bold text-white/75">
              {team.captainRank ||
                "Not specified"}
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
              Registered Roster
            </p>

            <h2 className="mt-1 text-2xl font-black uppercase">
              Players
            </h2>
          </div>

          {team.players.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="text-sm font-bold text-white/40">
                No players registered.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {team.players.map(
                (player, index) => (
                  <div
                    key={player.id}
                    className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/10 bg-black/30 text-[10px] font-black text-cyan-300/50">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-black uppercase">
                          {player.name}
                        </p>

                        <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-cyan-400/60">
                          {player.role ||
                            "Player"}
                        </p>
                      </div>
                    </div>

                    <span className="text-lg font-black text-white/10 transition group-hover:text-cyan-300/30">
                      →
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/tournament/matches"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white/50 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.05] hover:text-cyan-200"
          >
            View Tournament Matches →
          </Link>

          <Link
            href="/tournament/teams"
            className="rounded-lg border border-purple-400/20 bg-purple-400/[0.05] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-purple-200 transition hover:bg-purple-400/10"
          >
            ← Browse Teams
          </Link>
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="p-5 text-center">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${accent}`}
      >
        {value}
      </p>
    </div>
  );
}