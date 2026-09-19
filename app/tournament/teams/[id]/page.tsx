"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  Team,
  teams as initialTeams,
} from "../../../data/teams";

const TEAMS_STORAGE_KEY =
  "tournament-teams";

function loadTeams(): Team[] {
  if (typeof window === "undefined") {
    return initialTeams;
  }

  const stored =
    window.localStorage.getItem(
      TEAMS_STORAGE_KEY
    );

  if (!stored) {
    return initialTeams;
  }

  try {
    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Use defaults.
  }

  return initialTeams;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) =>
        word[0]?.toUpperCase()
      )
      .join("") || "TM"
  );
}

export default function PublicTeamDetailsPage() {
  const params = useParams();

  const teamId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [teams, setTeams] =
    useState<Team[]>([]);

  useEffect(() => {
    setTeams(loadTeams());
  }, []);

  const team = teams.find(
    (item) =>
      item.id === teamId
  );

  if (!team) {
    return (
      <main className="min-h-screen bg-[#080c12] text-white">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
            Team Not Found
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase">
            Team unavailable
          </h1>

          <Link
            href="/tournament/teams"
            className="mt-8 inline-block bg-white px-6 py-3 text-[10px] font-black uppercase tracking-wider text-black"
          >
            ← All Teams
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080c12] text-white">
      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
        <header className="mb-8 border-b border-white/10 pb-6">
          <Link
            href="/tournament/teams"
            className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white"
          >
            ← All Teams
          </Link>
        </header>

        <section className="border border-white/10 bg-white/[0.03]">
          <div className="flex flex-col gap-6 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-black/20">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt=""
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-3xl font-black text-white/30">
                  {initials(
                    team.name
                  )}
                </span>
              )}
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
                Seed {team.seed}
              </p>

              <h1 className="mt-2 text-4xl font-black uppercase sm:text-5xl">
                {team.name}
              </h1>

              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-white/30">
                {team.tag}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3">
            <Stat
              label="Wins"
              value={team.wins}
            />

            <Stat
              label="Losses"
              value={team.losses}
            />

            <Stat
              label="Players"
              value={team.players.length}
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
              Team Information
            </p>

            <h2 className="mt-1 text-2xl font-black uppercase">
              Captain / Rank
            </h2>
          </div>

          <div className="border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-bold text-white/70">
              {team.captainRank ||
                "Not specified"}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
              Registered Roster
            </p>

            <h2 className="mt-1 text-2xl font-black uppercase">
              Players
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {team.players.map(
              (player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-black/20 text-[10px] font-black text-white/25">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase">
                        {player.name}
                      </p>

                      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-cyan-400/60">
                        {player.role}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <div className="mt-8">
          <Link
            href="/tournament/matches"
            className="inline-block border border-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white/50 transition hover:border-cyan-400/30 hover:text-white"
          >
            View Tournament Matches →
          </Link>
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="border-r border-white/10 p-5 text-center last:border-r-0">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">
        {value}
      </p>
    </div>
  );
}